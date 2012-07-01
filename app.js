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