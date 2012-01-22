
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
};
