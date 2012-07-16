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

// Environment-specific URLs
var host_url, host_url_protocol,
    redirect_url, redirect_url_protocol,
    db_url;

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
  host_url = "//localhost:1338/";
  db_url = "mongodb://localhost/lambdaracer";
  redirect_url = "//localhost:1338/";
  app.use(express.errorHandler());
});

// Production environment
app.configure('production', function() {
  host_url = "//lambda-racer.jit.su/";
  db_url = "mongodb://tsnm:TsuNaMi@flame.mongohq.com:27047/lambdaracer";
  redirect_url = "//www.facebook.com/lambda.maximal/app_260510290719654";
  app.use(express.errorHandler());
});

// Middleware to set app-url according to protocol
var setAppUrl = function (req, res, next) {
  if(req.connection.encrypted) {
    host_url_protocol = 'https:' + host_url;
    redirect_url_protocol = 'https:' + redirect_url;
  } else {
    host_url_protocol = 'http:' + host_url;
    redirect_url_protocol = 'http:' + redirect_url;
  }

  // Expose host_url to views
  app.expose({ host_url: host_url_protocol }, 'lambdaracer.current'); // FIX, is in the code multiple times
  app.expose({ redirect_url: redirect_url_protocol }, 'lambdaracer.current'); // FIX, is in the code multiple times

  next();
};

// Express routes
app.get('/', setAppUrl, routes.index);
app.post('/', setAppUrl, routes.index);

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

var errOnMongoose;
// initialize DB
mongoose.connect(db_url, function(err) {
  errOnMongoose = err;
});

// Create server and initialize socket.io
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Compatibility for Heroku (commented out, while experimenting with nodejitsu)
//io.configure(function () {
//  io.set("transports", ["xhr-polling"]);
//  io.set("polling duration", 10);
//});

// Compatibility for nodejitsu
io.configure('production', function() {
  io.enable('browser client minification');  // send minified client
//  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);                    // reduce logging
});

io.set('transports', [
  'websocket',
  //'flashsocket' // not supported on nodejitsu
  'htmlfile',
  'xhr-polling',
  'jsonp-polling'
]);

// Events to monitor
io.sockets.on('connection', function (socket) {
  socket.emit('init', { numberOfPlayers: 10 });

  socket.on('init', function (data) {
    socket.emit('test', { receivedData: data, mongooseErr: errOnMongoose });
    socket.set('fbid', data.fbid, function() {
      addPlayerToSocket(data.fbid, socket, function (err, player) {
        if(err) {
          socket.emit('error');
        } else {
          socket.emit('test', { msg: "done adding player to socket", err: err, player: player });
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
              socket.emit('test', { playerToSocket: 'added player to socket' });
              player.time = data.lapTime;
              player.save();
            }
          });
        });
      } else {
        player.time = data.lapTime;
        player.save();
      }
    });
  });
});

var addPlayerToSocket = function(fbid, socket, callback) {
  socket.emit('test', { msg: "entered addPlayerToSocket", fbid: fbid });
  Player.findOne({fbid: fbid}, function(error, player) {
    var currentPlayer = player;
    socket.emit('test', { msg: "in findOne callback", error: error, player: player });

    if(error) { // emit error to client
      callback({err: 'there was an error'}, undefined);
      return;
    }

    if(currentPlayer === null) { // no player by that fbid in db yet, create one
      socket.emit('test', { msg: "currentPlayer was created and hopefully saved before", currentPlayer: currentPlayer });

      currentPlayer = new Player({ fbid: fbid, time: 0 }).save(function (err) {
        console.log("errror while saving player");
        socket.emit('test', { msg: "error while saving player to db", error: err });
      });

      socket.emit('test', { msg: "currentPlayer was created and hopefully saved after", currentPlayer: currentPlayer });
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
