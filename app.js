/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http');

var app = express();

// Express configuration
app.configure(function() {
  app.set('port', process.env.PORT || 1337);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
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
    req.facebook.get('/me/friends', { limit: 4 }, function(friends) {
      res.send('friends: ' + require('util').inspect(friends));
    });
  }
});

// See the full signed request details
app.get('/signed_request', function(req, res) {
  console.log("RECEIVED REQUEST THROUGH FACEBOOK");
  console.log(req.facebook.signed_request);
  res.send('Signed Request details: ' + require('util').inspect(req.facebook.signed_request));
});

app.post('/signed_request', function(req, res) {
  res.send('Signed Request details: ' + require('util').inspect(req.facebook.signed_request));
});

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
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

// Startup server
server.listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});