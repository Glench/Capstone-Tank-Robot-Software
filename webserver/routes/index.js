
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index.html')
};

// websockets!
var io = require('socket.io')

exports.socket_connection = function(socket){
    console.log('connect')
    socket.on('disconnect', function(){console.log('disconnect')})
};
