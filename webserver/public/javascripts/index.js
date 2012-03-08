var socket = io.connect('http://localhost')

socket.on('connect', function() {
    console.log('websocket connect')
});

socket.on('disconnect', function() {
    console.log('websocket disconnect');
    // alert('Lost connection with robot!');
});

// hash of arrow key code and if it's held down
var keys = {
    38: false, // up
    40: false, // down
    37: false, // left
    39: false,  // right
    should_send: false
};

$(document).keydown(function(evt) {
    if (evt.which in keys && !keys[evt.which]) {
        evt.preventDefault();
        keys[evt.which] = true;
        keys['should_send'] = true;
    }
});

$(document).keyup(function(evt) {
    if (evt.which in keys && keys[evt.which]) {
        evt.preventDefault();
        keys[evt.which] = false;
        keys['should_send'] = false;
    }
});

// TODO: 
// need mapping for speeds (get from slider) and also translation when holding
// down forward+left (right needs to go faster) if possible.
//
// also need function for saying what things are held down so you can use mouse
// as well
//
// also update gui to show 4 keys in correct arrow pattern
var encoded_movement = {
    left: 4,
    right: 4
};

var send_commands = function() {
    if (keys['should_send']) {
        // if the user wants it to go send instructions on websocket
        socket.emit('move', encoded_movement)
    }
};

setInterval(send_commands, 100)
