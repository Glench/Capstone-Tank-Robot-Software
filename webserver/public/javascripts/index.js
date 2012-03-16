var socket = io.connect('http://localhost')

socket.on('connect', function() {
    console.log('websocket connect')
});

socket.on('disconnect', function() {
    console.log('websocket disconnect');
    // alert('Lost connection with robot!');
});

$( "#speed" ).slider({
    value:4,
    min: 4,
    max: 6,
    step: 1
});


// hash of arrow key code and if it's held down
var key_map = {
    38: 'up', // up
    40: 'down', // down
    37: 'left', // left
    39: 'right',  // right
};

var inputs = {
    up: false,
    down: false,
    left: false,
    right: false,
    should_send: false
};

var translate_inputs_to_directions = function(speed, inputs) {
    // speed is 4, 5, 6
    var left_speed = 3,
        right_speed = 3,
        up = inputs.up,
        down = inputs.down,
        left = inputs.left,
        right = inputs.right,
        forward_backward_map = {6: 0, 5: 1, 4: 2},
        encoded = {left: left_speed, right: right_speed};

    if (up && !down) {
        if (up && !(left || right)) {
            encoded.left = encoded.right = speed;
        } else if (left && !right) {
            encoded.left = speed - 1;
            encoded.right = speed;
        } else if (!left && right) {
            encoded.right = speed - 1;
            encoded.left = speed;
        }
    } else if (!up && down) {
        speed = forward_backward_map[speed];
        if (down && !(left || right)) {
            encoded.left = encoded.right = speed;
        } else if (left && !right) {
            encoded.left = speed + 1;
            encoded.right = speed;
        } else if (!left && right) {
            encoded.right = speed + 1;
            encoded.left = speed;
        }
    } else if (left && !right) {
        encoded.left = forward_backward_map[speed];
        encoded.right = speed;
    } else if (!left && right) {
        encoded.left = speed;
        encoded.right = forward_backward_map[speed];
    }
    // success or failure case
    return encoded;
};

$(document).keydown(function(evt) {
    var direction = key_map[evt.which];
    if (direction in inputs && !inputs[direction]) {
        evt.preventDefault();
        inputs[direction] = true;
        inputs['should_send'] = true;
    }
});

$(document).keyup(function(evt) {
    var direction = key_map[evt.which];
    if (direction in inputs && inputs[direction]) {
        evt.preventDefault();
        inputs[direction] = false;
        inputs['should_send'] = false;
    }
});

// TODO: 
// fix left and right
// stop from scrolling
// fix forward to forward/left to forward

var send_commands = function() {
    if (inputs['should_send']) {
        // if the user wants it to go send instructions on websocket
        socket.emit('move', translate_inputs_to_directions($('#speed').slider('value'), inputs))
    }
};

setInterval(send_commands, 100)
