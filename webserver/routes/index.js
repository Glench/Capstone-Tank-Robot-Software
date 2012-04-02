var sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('db');
var serialport = require('serialport');
var SerialPort = serialport.SerialPort; // localize object constructor
var io = require('socket.io');

var config = {
    motor_serial: "/dev/tty.usbserial-A600cJpP",
    gps_serial: '/dev/cu.usbserial-A40111OI',
    camera_ip: '192.168.1.2',
    motor_on: false,
    gps_on: false
};

var GpsCoordinates = function(params) {
    return {
        latitude: params.latitude,
        longitude: params.longitude,
        speed: params.speed,
        db: params.db,
        id: null,
        save: function() {
            db.run('INSERT INTO gps VALUES (null, ?, ?, ?, 0)', [this.latitude, this.longitude, this.speed], this.insert_callback)
        },
        insert_callback: function(error) {
            console.log(arguments);
            // this.lastID contains id of insert
            if (!error) {
            }
        },
        convert_coordinates: function(latitude, longitude) {
            // gps gives us form of 4220.1835,N and we want 42.336391
            // expects a string
            // TODO: make this more robust, don't assume 2 or 3, split on '.'
            var lat_prefix = latitude.slice(0,2);
            var lat_suffix = parseFloat(latitude.slice(2));
            var long_prefix = longitude.slice(0,3);
            var long_suffix = parseFloat(longitude.slice(3));

            // concat the two important parts
            this.latitude = lat_prefix + '.' + ((lat_suffix / 60) + '').split('.')[1];
            this.longitude = long_prefix + '.' + ((long_prefix / 60) + '').split('.')[1];
        }
    };
};

if (config.gps_on) {
    db.run('CREATE TABLE IF NOT EXISTS gps (id INTEGER PRIMARY KEY, latitude REAL, longitude REAL, speed REAL, timestamp datetime default current_timestamp, is_repeater INTEGER)');
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

if (config.motor_on) {
    var motor_serial = new SerialPort(config.motor_serial, {
        parser: serialport.parsers.readline("\n")
    });
}

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index.html',
    {
        locals: {
            camera_ip: config.camera_ip
        }
    }
  );
};

exports.socket_connection = function(socket){
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
        db.run('UPDATE gps SET is_repeater = 1 ORDER BY id DESC LIMIT 1');
        // TODO have to actually send a command to the microcontroller
    });
};
