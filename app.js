var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
    mongoose = require('mongoose'),
    users = {};

server.listen(3000);

app.use(express.static(__dirname + '/app'));

mongoose.connect('mongodb://localhost/chat', function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log('Connected to mongodb');
    }
});

var chatSchema = mongoose.Schema({
    // name: {first: String, last: String},
    nick: String,
    msg: String,
    created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
    var query = Chat.find({});

    query.sort('-created').limit(8).exec(function(err, docs) {
        if(err) throw err;
        console.log('Sending old msgs');
        socket.emit('load old msgs', docs);
    });
    socket.on('new user', function(data, callback) {
        if (data in users) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            updateNicknames();
        }
    });

    function updateNicknames() {
        io.sockets.emit('usernames', Object.keys(users));
    }

    socket.on('send message', function(data, callback) {
        var msg = data.trim();
        if(msg.substr(0,3) === '/w ') {
            msg = msg.substr(3);
            var ind = msg.indexOf(' ');
            if(ind !== -1) {
                var name = msg.substring(0, ind);
                var msg = msg.substring(ind + 1);
                if(name in users) {
                    users[name].emit('whisper', {msg: msg, nick: socket.nickname, type: 'whisper'});
                    console.log('Whisper');
                } else {
                    io.sockets.emit('error', {msg: 'Error: Enter a valid user.', type: 'error'});
                    // callback('Error: Enter a valid user');
                }
                
            } else {
                // callback('Error: Please enter a message for your whisper.');
                io.sockets.emit('error', {msg: 'Please enter a message for your whisper.', type: 'error'});
            }
        } else {
            var newMsg = new Chat({msg: msg, nick: socket.nickname});
            newMsg.save(function(err){
                if(err) throw err;
                io.sockets.emit('new message', {msg: msg, nick: socket.nickname, created: Date.now, type: 'new-message'});
            });
        }
    });

    socket.on('disconnect', function(data) {
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames();
    });
});