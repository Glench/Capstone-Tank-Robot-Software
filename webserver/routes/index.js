// var serialport = require('serialport')
// var SerialPort = serialport.SerialPort; // localize object constructor

// var serial = new SerialPort("/dev/tty.usbserial-A600cJpP", {
//     parser: serialport.parsers.readline("\n")
// });

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index.html',
    {
        locals: {
            camera_ip: '192.168.1.2'
        }
    }
  );
};

// websockets!
var io = require('socket.io')

exports.socket_connection = function(socket){
    console.log('connect')

    socket.on('disconnect', function(){console.log('disconnect')})

    socket.on('move', function (data) {
        console.log('movement command received', new Date(), data);
        // make sure to write string and not numberic values
        // serial.write('' + data['left'] + data['right']);
    });
};
