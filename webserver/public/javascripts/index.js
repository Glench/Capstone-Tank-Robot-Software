var coordinates = [];
var connect_options = {'sync disconnect on unload': false}
// var socket = io.connect('http://192.168.10.220', connection_options)
var socket = io.connect('http://localhost', connection_options);

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
    }
});
$('#controls .btn').mouseup(function(evt) {
    var $btn = $(evt.target);
    var direction = key_map[$btn.data('key')];
    if (direction in inputs && inputs[direction]) {
        evt.preventDefault();
        inputs[direction] = false;
        inputs['should_send'] = false;
    }
});

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
    zoom: 8,
    center: new OpenLayers.LonLat(-71.059, 42.358)
            .transform(
                new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
                new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
            )
});
var markers_layer = new OpenLayers.Layer.Markers("Markers");
markers_layer.id = 'Markers';
var icon = new OpenLayers.Icon('/OpenLayers/img/marker-blue.png',
    new OpenLayers.Size(21, 25),
    new OpenLayers.Pixel(0, 0)
);
var repeater_icon = new OpenLayers.Icon('/OpenLayers/img/marker.png',
    new OpenLayers.Size(21, 25),
    new OpenLayers.Pixel(0, 0)
);

// debug
var lonlat = new OpenLayers.LonLat(-71.059, 42.358);
lonlat.transform(
    new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
    new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
)
var marker = new OpenLayers.Marker(lonlat, icon.clone())
markers_layer.addMarker(marker)

map.addLayer(markers_layer);

// 'OpenLayers/img/marker.png'

// styling map here because some default styles are weird
$('.olControlZoomPanel').css('top', '10px');
$('.olControlAttribution').css('bottom', 0);

var GpsCoordinates = function(data) {
    var projection1 = new OpenLayers.Projection("EPSG:4326"); // transform from WGS 1984
    var projection2 = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
    return {
        lat: data.latitude,
        lon: data.longitude,
        text: data.speed + ' knots at ' + data.timestamp,
        _ol_lon_lat: function() {
            // these are the 'normal' coordinates
            // used in a function so the latest data is always used to generate
            return new OpenLayers.LonLat(this.lon, this.lat);
        },
        ol_lon_lat: function() {
            // these are the transformed coordinates to work with OSM
            // used in a function so the latest data is always used to generate
            return new OpenLayers.LonLat(this.lon, this.lat).transform(projection1, projection2);
        }
    }
};

socket.on('connect', function() {
    console.log('websocket connect')
    $(document).find('#controls .btn').removeClass('btn-danger');
    $(document).find('#controls .status').hide();
});

socket.on('gps_coordinate', function(data) {
    var gps_coordinate = GpsCoordinates(data);
    coordinates.push(gps_coordinate);
    var ol_coordinate = gps_coordinate.ol_lon_lat()
    map.getLayer('Markers').addMarker(new OpenLayers.Marker(ol_coordinate, icon.clone()));
    // set this to center of map
    map.setCenter(ol_coordinate, map.getZoom(), false, false);
});

socket.on('disconnect', function() {
    console.log('websocket disconnect');
    $(document).find('#controls .btn').addClass('btn-danger');
    $(document).find('#controls .status').show();
});

$(window).bind('beforeunload', function(evt) {
    console.log('soft websocket disconnect')
    // TODO make sure that when user decides to stay on page that we send another connect
    socket.emit('soft_disconnect'); // let the server know this isn't a hard disconnect
    return ''
});
$(window).bind('unload', function(evt) {
    socket.disconnect();
});

// send websocket event when pressing deploy button
$('#map .btn').click(function(evt) {
    // set the latest marker as a repeater
    var markers = map.getLayer('Markers').markers;
    markers[markers.length - 1].icon.setUrl(repeater_icon.url);
    socket.emit('deploy_repeater');
})

