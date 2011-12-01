var socket = io.connect('http://localhost')

socket.on('connect', function() {
    console.log('websocket connect')
});

socket.on('disconnect', function() {
    console.log('websocket disconnect')
});
