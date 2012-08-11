/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , io = require('socket.io')
  , mustache = require('mustache')
  , nodeio = require('node.io')
  , sqlite = require('sqlite3').verbose()
  , db = new sqlite.Database('db')
  , serialport = require('serialport')
  , SerialPort = serialport.SerialPort // localize object constructor

var app = module.exports = express.createServer();

// Configuration

var tmpl = {
    compile: function (source, options) {
        if (typeof source == 'string') {
            return function(options) {
                options.locals = options.locals || {};
                options.partials = options.partials || {};
                if (options.body) // for express.js > v1.0
                    locals.body = options.body;
                return mustache.to_html(
                    source, options.locals, options.partials);
            };
        } else {
            return source;
        }
    },
    render: function (template, options) {
        template = this.compile(template, options);
        return template(options);
    }
};


app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  // disable layout to render html files
  app.set("view options", {layout: false});

  // make a custom html template
  // app.register('.html', {
  //   compile: function(str, options){
  //     return function(locals){
  //       return str;
  //     };
  //   }
  // });

  app.register(".html", tmpl)

});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


// Routes

app.get('/', routes.index);

// local config
var config = {
    // motor_on: false,
    // gps_on: false,
    // scrape_ddwrt: true
    // motor_serial: '/dev/cu.usbmodemfa141', // mac
    // gps_serial: '/dev/cu.usbserial-A40111OI', // mac
    motor_serial: "/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_A600cJpP-if00-port0", // eee
    gps_serial: '/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_A40111OI-if00-port0', // eee
    motor_on: true,
    gps_on: false,
    scrape_ddwrt: true
};

db.run('CREATE TABLE IF NOT EXISTS movement (id INTEGER PRIMARY KEY, command TEXT, timestamp DATETIME default current_timestamp)');
if (config.motor_on) {
    app.set('should_rewind', true);
    var motor_serial = new SerialPort(config.motor_serial, {
        parser: serialport.parsers.readline("\n")
    });
}

// handle websocket stuff
var num_repeaters = 0;

var sio = io.listen(app)
sio.sockets.on('connection', function(socket) {
    console.log('connect')

    // make sure that if we reconnected we don't keep rewinding commands
    if (config.motor_on) {
        app.set('should_rewind', true);
    }

    socket.on('soft_disconnect', function() {
        console.log('soft_disconnect')
        app.set('should_rewind', false);
    });

    socket.on('disconnect', function(){
        console.log('disconnect')
        if (config.motor_on && app.set('should_rewind') && false) {
            // TODO: remove and test rewind code
            console.log('reversing in 8 seconds! :O')
            // 1000 rows is about the last 1 minute 40 seconds
            var rewind = function() {
                var reverse_movement = function(movement) {
                    var command = movement.split('');
                    var reverse_command = [];
                    var forward_backward_map = {
                        '6': 0,
                        '5': 1,
                        '4': 2,
                        '0': 6,
                        '1': 5,
                        '2': 4,
                    };
                    // only first 2 parts of string are motor movement, don't
                    // want to repeat or translate repeater deployment
                    for (var i = 0; i < 2; ++i) {
                        reverse_command.push(forward_backward_map[command[i]]);
                    }
                    reverse_command.push('0')
                    return reverse_command.join('');
                };
                // select only from most recent commands in 5 minutes
                var d1 = new Date (),
                d2 = new Date ( d1 );
                d2.setMinutes ( d1.getMinutes() - 5 );
                var sqlite_dt = d2.toISOString().replace('Z', '').replace('T', ' ');
                db.each('SELECT * FROM movement WHERE timestamp > ? ORDER BY id DESC limit 1000', [sqlite_dt], function(err, movement) {
                    // It's a stupid express convention to call 'set' when it means 'get'.
                    // Also should not rerun commands if we've already reconnected.
                    if (!err && app.set('should_rewind')) {
                        motor_serial.write(reverse_movement(movement.command));
                    }
                });
            };
            // wait before rewinding in case this is a transient phenomenon
            setTimeout(rewind, 1000*8);
        }
    });

    socket.on('move', function (data) {
        console.log('movement command received', new Date(), data);
        var command = '' + data['left'] + data['right'] + '0';
        // log call movement commands
        db.run('INSERT INTO movement (command) VALUES (?)', [command]);
        if (config.motor_on) {
            // make sure to write string and not numberic values
            motor_serial.write(command);
        }
    });

    socket.on('deploy_repeater', function(data) {
        console.log('deploy repeater command received', new Date())
        // workaround for not having update order by or limit support
        db.get('SELECT id FROM gps order by id desc limit 1', function(err, row){
            if (row) {
                db.run('UPDATE gps SET is_repeater = 1 where id = ?', row.id);
            }
        });

        if (config.motor_on) {
            db.all('select * from gps where is_repeater = 1', function(err, rows) {
                if (num_repeaters == 0) {
                    motor_serial.write('33a');
                    motor_serial.write('33a');
                } else {
                    motor_serial.write('33b');
                }
                num_repeaters = num_repeaters + 1;

                // motor_serial.write('00' + (rows.length+1))
            });
        }
    });
});

// handle GPS parsing and saving
db.run('CREATE TABLE IF NOT EXISTS gps (id INTEGER PRIMARY KEY, latitude REAL, longitude REAL, speed REAL, timestamp DATETIME default current_timestamp, is_repeater INTEGER)');
var GpsCoordinates = function(params) {
    return {
        latitude: params.latitude,
        longitude: params.longitude,
        speed: params.speed,
        db: params.db,
        id: null,
        save: function() {
            db.run('INSERT INTO gps (latitude, longitude, speed, is_repeater) VALUES (?, ?, ?, 0)', [this.latitude, this.longitude, this.speed], this.insert_callback)
        },
        insert_callback: function(error) {
            // this.lastID contains id of insert
            if (!error) {
                db.get('select * from gps where id = ?', this.lastID, function(err, row) {
                    sio.sockets.emit('gps_coordinate', row);
                });
            } else {
                console.log(error);
            }
        },
        convert_coordinates: function(latitude, longitude) {
            // gps gives us form of 4220.1835,N and we want 42.336391
            // expects a string
            var lat_split = latitude.split('.');
            var lon_split = longitude.split('.');

            // 2 places to left of decimal are the start of the minutes
            var lat_minutes_left_of_decimal = lat_split[0].slice(-2);
            var lon_minutes_left_of_decimal = lon_split[0].slice(-2);

            var lat_prefix = lat_split[0].slice(0, -2);
            var lat_suffix = parseFloat(lat_minutes_left_of_decimal + '.' + lat_split[1]);
            var lon_prefix = lon_split[0].slice(0, -2);
            var lon_suffix = parseFloat(lon_minutes_left_of_decimal + '.' + lon_split[1]);

            // concat the two important parts
            this.latitude = lat_prefix + '.' + ((lat_suffix / 60) + '').split('.')[1];
            this.longitude = lon_prefix + '.' + ((lon_suffix / 60) + '').split('.')[1];
        }
    };
};

// debug
// var debug = function() {
//     var gps = GpsCoordinates({speed:3.2, db: db});
//     gps.convert_coordinates('4220.1835', '-07105.3121');
//     gps.save();
// };
// setTimeout(debug, 1000*5)

if (config.gps_on) {
    var gps_serial = new SerialPort(config.gps_serial, {
        parser: serialport.parsers.readline('\r\n'),
        baudrate: 4800
    });
    gps_serial.on('data', function(data){
        // $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
        var gps_data_array = data.split(',');
        if (gps_data_array[0] == '$GPRMC' && gps_data_array[2] == 'A') {
            var sign_convert = {
                N: '',
                S: '-',
                E: '',
                W: '-'
            };
            var gps_coordinates = GpsCoordinates({
                speed: gps_data_array[7],
                db: db
            });
            var lat_sign = sign_convert[gps_data_array[4]];
            var long_sign = sign_convert[gps_data_array[6]];
            gps_coordinates.convert_coordinates(lat_sign+gps_data_array[3], long_sign+gps_data_array[5]);
            gps_coordinates.save();
        }
    });
}

if (config.scrape_ddwrt) {
    var scrape = function() {
        // look at base to repeater 1 strength
        var job1 = new nodeio.Job({jsdom: true}, {
            input: false,
            run: function (url) {
                var self = this;
                var url = '192.168.1.1/Info.live.htm';
                self.get(url, function(err, data) {
                    if (!err) {
                        var text = data;
                        var base_index = text.indexOf('Repeater 1","');
                        // these are magic constants we reverse-engineered from dd-wrt
                        var signal = parseInt(text.slice(base_index+13, base_index+13+3))
                        if (signal) {
                            var percent = signal * 1.24 + 116;
                        } else {
                            var percent = signal;
                        }
                        if (base_index != -1) {
                            var output = {
                                num: 1,
                                percent: percent
                            }
                            self.emit(output)
                        } else {
                            self.exit({'err': 'not present', 'num': 2});
                        }
                    } else {
                        self.exit({'err': err, 'num': 1});
                    }
                });
            }
        });

        // look at repeater2 to repeater 1 strength
        // copy and paste because I can't figure out why an array in 'input' won't work
        var job2 = new nodeio.Job({jsdom: true}, {
            input: false,
            run: function (url) {
                var self = this;
                var url = '192.168.1.2/Info.live.htm';
                self.get(url, function(err, data) {
                    if (!err) {
                        var text = data;
                        var base_index = text.indexOf('Repeater 2","');
                        // these are magic constants we reverse-engineered from dd-wrt
                        var signal = parseInt(text.slice(base_index+13, base_index+13+3));
                        if (signal) {
                            var percent = signal * 1.24 + 116;
                        } else {
                            var percent = signal;
                        }
                        if (base_index != -1) {
                            var output = {
                                num: 2,
                                percent: percent
                            }
                            self.emit(output)
                        } else {
                            self.exit({'err': 'not present', 'num': 2});
                        }
                    } else {
                        self.exit({'err': err, 'num': 2});
                    }
                });
            }
        });
        var start_job = function(job) {
            nodeio.start(job, function (err, output) {
                if (!err) {
                    // not sure why this sends an array
                    sio.sockets.emit('repeater_strength', output[0])
                } else {
                    sio.sockets.emit('repeater_strength', err)
                }
            }, true);
        };
        start_job(job1);
        start_job(job2);
    }
    setInterval(scrape, 5*1000)
}


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

