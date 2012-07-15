/**
 * LAMBDA Racer Server v0.1
 */

// Requires
var express   = require('express'),
    mongoose  = require('mongoose'),
    routes    = require('./routes'),
    http      = require('http'),
    expose    = require('express-expose');

// Models
var Player = require('./models/player.js');

// App
var app = express();

// Express configuration
app.configure(function() {
  app.set('port', process.env.PORT || 1338);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "lambda racer" }));
  app.use(require('faceplate').middleware({
    app_id: process.env.FACEBOOK_APP_ID || '260510290719654',
    secret: process.env.FACEBOOK_SECRET || 'f7a9e6ee38d5c2f821fc4c0385f87f4d',
    scope: 'user_likes'
  }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express['static'](__dirname + '/public'));
});

// Development environment
app.configure('development', function() {
  app.use(express.errorHandler());
});

// Production environment
app.configure('production', function() {
  app.use(express.errorHandler());
});

// Express routes
app.get('/', routes.index);
app.post('/', routes.index);

app.get('/friends', function(req, res) {
  if(!req.facebook) {
    res.render('appauth', {title: 'Authentication'});
  } else {
    req.facebook.get('/me/friends', { limit: 4 }, function(friends) {
      res.send('friends: ' + require('util').inspect(friends));
    });
  }
});

app.post('/friends', function(req, res) {
  if(!req.facebook) {
    res.render('appauth', {title: 'Authentication'});
  } else {
    req.facebook.get('/me/friends', { limit: 4 }, function(noclue, friends) {
      res.send('friends: ' + require('util').inspect(friends));
    });
  }
});

// See the full signed request details
app.get('/signed_request', function(req, res) {
  res.send('Signed Request details: ' + require('util').inspect(req.facebook.signed_request));
});

app.post('/signed_request', function(req, res) {
  res.send('Signed Request details: ' + require('util').inspect(req.facebook.signed_request));
});

// initialize DB
mongoose.connect('mongodb://localhost/lambdaracer');

// Create server and initialize socket.io
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Compatibility for Heroku
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

// Events to monitor
io.sockets.on('connection', function (socket) {
  socket.emit('init', { numberOfPlayers: 10 });

  socket.on('init', function (data) {
    socket.set('fbid', data.fbid, function() {
      addPlayerToSocket(data.fbid, socket, function (err, player) {
        if(err) {
          socket.emit('error');
        } else {
          socket.emit('ready');
        }
      });
    });
  });

  socket.on('update laptime', function(data) {
    console.log("UPDATE LAPTIME");
    socket.get('player', function(err, player) {
      if(err) {
        socket.get('fbid', function(err, fbid) {
          if(err || fbid === null) {
            socket.emit('error');
          }

          addPlayerToSocket(fbid, socket, function (err, player) {
            if(err) {
              socket.emit('error');
            } else {
              player.time = data.lapTime;
              player.save();
            }
          });
        });
      } else {
        player.time = data.lapTime;
        player.save();
        console.log("LAPTIME SAVED");
      }
    });
  });
});

var addPlayerToSocket = function(fbid, socket, callback) {
  Player.findOne({fbid: fbid}, function(error, player) {
    var currentPlayer = player;

    if(error) { // emit error to client
      callback({err: 'there was an error'}, undefined);
      return;
    }

    if(currentPlayer === null) { // no player by that fbid in db yet, create one
      currentPlayer = new Player({ fbid: data.fbid, time: 0 }).save();
    }

    socket.set('player', currentPlayer, function() {
      callback(undefined, currentPlayer);
    });
  });
};

// Startup server
server.listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});
