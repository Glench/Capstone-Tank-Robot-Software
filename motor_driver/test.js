var serialport = require('serialport')
var SerialPort = serialport.SerialPort; // localize object constructor

var sp = new SerialPort("/dev/tty.usbserial-A600cJpP", {
    parser: serialport.parsers.readline("\n")
});

sp.write(33);

