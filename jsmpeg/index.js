var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var proc;
app.use('/', express.static(path.join(__dirname, 'stream')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
var sockets = {};
io.on('connection', function(socket) {
    sockets[socket.id] = socket;
    console.log("Total clients connected : ", Object.keys(sockets).length);
    socket.on('disconnect', function() {
        delete sockets[socket.id];
        // no more sockets, kill the stream
        if (Object.keys(sockets).length == 0) {
            app.set('watchingFile', false);
            if (proc) proc.kill();
            fs.unwatchFile('./stream/image_stream.jpg');
        }
    });
    socket.on('start-stream', function() {
        startStreaming(io);
    });
});
http.listen(3000, function() {
    console.log('listening on *:3000');
});

function stopStreaming() {
    console.log("stopStreaming");
    if (Object.keys(sockets).length == 0) {
        app.set('watchingFile', false);
        if (proc) proc.kill();
        fs.unwatchFile('./stream/image_stream.jpg');
    }
}

function startStreaming(io) {
    console.log("startStreaming begin...");
    if (app.get('watchingFile')) {
        console.log("watchingFile if...");
        var t = (Math.random() * 100000);
        var imageName = 'image_stream.jpg?_t=' + t;
        console.log("image name is " + imageName);
        io.sockets.emit('liveStream', imageName);
        return;
    }
    console.log("startStreaming else...");
    var args = ["-w", "640", "-h", "480", "-o", "./stream/image_stream.jpg", "-t", "999999999", "-tl", "100"];
    proc = spawn('raspistill', args);
    console.log('Watching for changes...');
    app.set('watchingFile', true);
    fs.watchFile('./stream/image_stream.jpg', function(current, previous) {
        console.log("watchingFile...");
        io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
    })
}