/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , io = require('socket.io')
  , mustache = require('mustache')

var sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('db');
var serialport = require('serialport');
var SerialPort = serialport.SerialPort; // localize object constructor

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
    motor_serial: "/dev/tty.usbserial-A600cJpP",
    gps_serial: '/dev/cu.usbserial-A40111OI',
    motor_on: false,
    gps_on: false
};

if (config.motor_on) {
    var motor_serial = new SerialPort(config.motor_serial, {
        parser: serialport.parsers.readline("\n")
    });
}

// handle websocket stuff
var sio = io.listen(app)
sio.sockets.on('connection', function(socket) {
    console.log('connect')

    socket.on('disconnect', function(){console.log('disconnect')})

    socket.on('move', function (data) {
        console.log('movement command received', new Date(), data);
        // make sure to write string and not numberic values
        if (config.motor_on) {
            motor_serial.write('' + data['left'] + data['right']);
        }
    });

    socket.on('deploy_repeater', function(data) {
        console.log('deploy repeater command received', new Date())
        // db.run('UPDATE gps SET is_repeater = 1 ORDER BY id DESC LIMIT 1');
        // TODO have to actually send a command to the microcontroller
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
            // TODO: send this data on websocket
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
            this.longitude = lon_prefix + '.' + ((lon_prefix / 60) + '').split('.')[1];
        }
    };
};

// debug
var debug = function() {
    var gps = GpsCoordinates({speed:3.2, db: db});
    gps.convert_coordinates('4220.1835', '-07105.3121');
    gps.save();
};
setTimeout(debug, 1000*5)

if (config.gps_on) {
    var gps_serial = new SerialPort(config.gps_serial, {
        parser: serialport.parsers.readline('\r'),
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


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

