var sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('db');
var serialport = require('serialport')
var SerialPort = serialport.SerialPort; // localize object constructor

var config = {
    motor_serial: '/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_A600cJpP-if00-port0', // "/dev/tty.usbserial-A600cJpP",
    gps_serial: '/dev/cu.usbserial-A40111OI',
    camera_ip: '192.168.1.2',
    motor_on: true,
    gps_on: false
};

if (config.gps_on) {
    db.run('CREATE TABLE IF NOT EXISTS gps (id INTEGER PRIMARY KEY, latitude REAL, longitude REAL, speed REAL, is_repeater INTEGER)');
    var gps_serial = new SerialPort(config.gps_serial, {
        parser: serialport.parsers.readline('\r'),
        baudrate: 4800
    });
    gps_serial.on('data', function(data){
        // $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
        var gps_data_array = data.split(',');
        if (gps_data_array[0] == '$GPRMC' && gps_data_array[2] == 'A') {
            var gps_data = {
                lat: gps_data_array[3],
                lon: gps_data_array[5],
                speed: gps_data_array[7]
            }
            // TODO put these values in db
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

if (config.gps_on) {
    exports.get_gps = function(req, res) {
        // db.each('SELECT * FROM gps;', function(err, rows) {
        // send back on websocket
        // });
    };
}

// websockets!
var io = require('socket.io')

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
};
