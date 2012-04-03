var coordinates = [];
var socket = io.connect('http://192.168.10.220')
// var socket = io.connect('http://localhost')

socket.on('connect', function() {
    console.log('websocket connect')
});

socket.on('gps_coordinate', function(data) {
    coordinates.push(data)
});

socket.on('disconnect', function() {
    console.log('websocket disconnect');
    // alert('Lost connection with robot!');
});

$( "#speed" ).slider({
    value:4,
    min: 4,
    max: 6,
    step: 1,
    change: function(evt, ui) {
        // defocus the slider after changing speed so this doesn't interfere
        // with trying to drive with the keyboard
        $(ui.handle).blur()
    }
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
    // prevent scrolling when holding down arrow keys
    if (evt.which in key_map) {
        evt.preventDefault();
    }
});

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
$('#controls .btn').mousedown(function(evt) {
    var $btn = $(evt.target);
    var direction = key_map[$btn.data('key')];
    if (direction in inputs && !inputs[direction]) {
        evt.preventDefault();
        inputs[direction] = true;
        inputs['should_send'] = true;
        console.log(inputs)
    }
});
$('#controls .btn').mouseup(function(evt) {
    var $btn = $(evt.target);
    var direction = key_map[$btn.data('key')];
    if (direction in inputs && inputs[direction]) {
        evt.preventDefault();
        inputs[direction] = false;
        inputs['should_send'] = false;
        console.log(inputs)
    }
});

// send websocket event when pressing deploy button
$('#map .btn').click(function(evt) {
    socket.emit('deploy_repeater');
})

// disable links we don't actaully want to do anything
$('a[href$="#null"]').click(function(evt){
    evt.preventDefault();
    $(evt.target).blur();
});

var send_commands = function() {
    if (inputs['should_send']) {
        // if the user wants it to go send instructions on websocket
        socket.emit('move', translate_inputs_to_directions($('#speed').slider('value'), inputs))
    }
};

setInterval(send_commands, 100);

// the map controls
var map = new OpenLayers.Map({
    div: "js_map",
    controls: [
        new OpenLayers.Control.Attribution(),
        new OpenLayers.Control.TouchNavigation({
            dragPanOptions: {
                enableKinetic: true
            }
        }),
        new OpenLayers.Control.ZoomPanel()
    ],
    layers: [
        new OpenLayers.Layer.OSM("OpenStreetMap", null, {
            transitionEffect: "resize"
        })
    ],
    zoom: 4,
    center: new OpenLayers.LonLat(-71.059, 42.358)
});
var vectorLayer = new OpenLayers.Layer.Vector("Overlay");
var feature = new OpenLayers.Feature.Vector(
 new OpenLayers.Geometry.Point(-70, 42),
 {some:'data'},
 {externalGraphic: 'OpenLayers/img/marker.png', graphicHeight: 21, graphicWidth: 16});
vectorLayer.addFeatures(feature);
map.addLayer(vectorLayer);

// styling map here because some default styles are weird
$('.olControlZoomPanel').css('top', '10px');
$('.olControlAttribution').css('bottom', 0);
