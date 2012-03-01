var socket = io.connect('http://localhost')

socket.on('connect', function() {
    console.log('websocket connect')
});

socket.on('disconnect', function() {
    console.log('websocket disconnect')
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
        console.log('added');
        keys[evt.which] = true;
        keys['should_send'] = true;
    }
});

$(document).keyup(function(evt) {
    if (evt.which in keys && keys[evt.which]) {
        console.log('removed');
        keys[evt.which] = false;
        keys['should_send'] = false;
    }
});


// TODO: set timeout that sets timeout so this runs constantly polling for data
// need mapping for speeds (get from slider) and also translation when holding
// down forward+left (right needs to go faster) if possible.
//
// also need function for saying what things are held down so you can use mouse
// as well
//
// also update gui to show 4 keys in correct arrow pattern
var send_commands = function() {
    if (keys['should_run']) {

    }
};
