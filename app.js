/**
 * LAMBDA Racer Server v0.1
 */

// Requires
var express     = require('express'),
    mongoose    = require('mongoose'),
    routes      = require('./routes'),
    http        = require('http'),
    expose      = require('express-expose'),
    nodemailer  = require('nodemailer');

// Models
var Player = require('./models/player.js');

// App
var app = express();

// Environment-specific URLs
var host_url, host_url_protocol,
    redirect_url, redirect_url_protocol,
    db_url;

// Permissions required on Facebook
var required_permissions = ['user_likes','publish_stream'];

// Express configuration
app.configure(function () {
  app.set('port', process.env.PORT || 1338);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "lambda racer" }));
  app.use(require('faceplate').middleware({
    app_id: process.env.FACEBOOK_APP_ID || '260510290719654', // TODO remove from repository
    secret: process.env.FACEBOOK_SECRET || 'f7a9e6ee38d5c2f821fc4c0385f87f4d', // TODO remove from repository
    scope: 'user_likes'
  }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express['static'](__dirname + '/public'));
});

// Development environment
app.configure('development', function () {
  host_url = "//localhost:1338/";
  db_url = "mongodb://localhost/lambdaracer";
  redirect_url = "//localhost:1338/";
  app.use(express.errorHandler());
});

// Production environment
app.configure('production', function () {
  host_url = "//lambda-racer.nodejitsu.com/"; // SSL-problem when using *.jit.su? try using *.nodejitsu.com
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

  // Expose general data to views
  app.expose({ host_url: host_url_protocol }, 'lambdaracer.current'); // FIX, is in the code multiple times
  app.expose({ redirect_url: redirect_url_protocol }, 'lambdaracer.current'); // FIX, is in the code multiple times
  app.expose({ required_permissions: required_permissions }, 'lambdaracer.current'); // FIX, is in the code multiple times

  next();
};

// Express routes
app.get('/', setAppUrl, routes.index);
app.post('/', setAppUrl, routes.index);

// See the full signed request details
app.get('/signed_request', function (req, res) {
  res.send('Signed Request details: ' + require('util').inspect(req.facebook.signed_request));
});

app.post('/signed_request', function (req, res) {
  res.send('Signed Request details: ' + require('util').inspect(req.facebook.signed_request));
});

// initialize DB
mongoose.connect(db_url);

// Create server and initialize socket.io
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Compatibility for Heroku (commented out, while experimenting with nodejitsu)
/*io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});*/

// Compatibility for nodejitsu
io.configure('production', function () {
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
  getLeaderBoardData(function (err, result) {
    if(err) {
      socket.emit('error', { err: err.err });
    } else {
      socket.emit('init', { result: result.slice(0, 10) });
    }
  });

  socket.on('init', function (data) {
    socket.set('fbid', data.fbid, function () {
      addPlayerToSocket(data.fbid, data.name, socket, function (err, player) {
        if(err) {
          socket.emit('error', { err: err.err });
        } else {
          sendInfoMail(player.name + " hat angefangen zu spielen", "Beste Zeit von " + player.name + "bisher: " + player.time);
          socket.broadcast.emit('player connected', { name: player.name  });
          socket.emit('ready');
        }
      });
    });
  });

  socket.on('update laptime', function (data) {
    socket.get('player', function (err, player) {
      if(err) {
        socket.get('fbid', function (err, fbid) {
          if(err || fbid === null) {
            socket.emit('error', { err: "there was an error for socket.get('fbid') && fbid === null" });
          }

          addPlayerToSocket(fbid, socket, function (err, player) {
            if(err) {
              socket.emit('error', { err: err.err });
            } else {
              if(player.time == 0 || data.lapTime < player.time) {
                player.time = data.lapTime;
                player.save();

                socket.broadcast.emit('new best time', { name: player.name, lapTime: data.lapTime });
                socket.emit('new personal best time', { lapTime: data.lapTime });
                sendInfoMail(player.name + " hat eine neue Bestzeit: " + data.lapTime, "Beste Zeit von " + player.name + "bisher: " + data.lapTime);

                getLeaderBoardData(function (err, result) {
                  if(err) {
                    socket.emit('error', { err: err.err });
                  } else {
                    socket.broadcast.emit('update leaderboard', { result: result.slice(0, 10), player: player });
                  }
                });
              } else {
                socket.broadcast.emit('new laptime', { name: player.name, lapTime: data.lapTime });
                socket.emit('new personal laptime', { lapTime: data.lapTime });
              }
            }
          });
        });
      } else {
        if(player.time == 0 || data.lapTime < player.time) {
          player.time = data.lapTime;
          player.save();

          socket.broadcast.emit('new best time', { name: player.name, lapTime: data.lapTime });
          socket.emit('new personal best time', { lapTime: data.lapTime });
          sendInfoMail(player.name + " hat eine neue Bestzeit: " + data.lapTime, "Beste Zeit von " + player.name + "bisher: " + data.lapTime);

          getLeaderBoardData(function (err, result) {
            if(err) {
              socket.emit('error', { err: err.err });
            } else {
              socket.emit('update leaderboard', { result: result.slice(0, 10), player: player });
              socket.broadcast.emit('update leaderboard', { result: result.slice(0, 10), player: player });
            }
          });
        } else {
          socket.broadcast.emit('new laptime', { name: player.name, lapTime: data.lapTime });
          socket.emit('new personal laptime', { lapTime: data.lapTime });
        }
      }
    });
  });
});

// TODO refactor functions into their own file
var addPlayerToSocket = function (fbid, name, socket, callback) {
  Player.findOne({ fbid: fbid }, function (error, player) {
    var currentPlayer = player;

    if(error) { // emit error to client
      callback({err: 'there was an error for Player.findOne()'}, undefined);
      return;
    }

    if(currentPlayer === null) { // no player by that fbid in db yet, create one
      currentPlayer = new Player({ fbid: fbid, name: name, time: 0 });

      currentPlayer.save(function (err) {
        if(err) {
          callback({ err: 'there was an error for new Player().save()' }, undefined);
        }
      });

      socket.emit('first time play');
      sendInfoMail(currentPlayer.name + " spielt das erste mal", "Beste Zeit von " + currentPlayer.name + "bisher: " + currentPlayer.time);
    }

    socket.set('player', currentPlayer, function () {
      callback(undefined, currentPlayer);
    });
  });
};

var getLeaderBoardData = function (callback) {
  Player.where('time').gt(0)
       .where('fbid').exists()
       .sort('time', 1)
       .run(function(err, result) {
    if(err) {
      callback({ err: 'there was an error for Player.where()' }, undefined);
    } else {
      callback(undefined, result);
    }
  });
};

// Configure statistics-mailing
var smtpTransport = nodemailer.createTransport("SMTP", {
  host: "smtp.sendgrid.net",
  secureConnection: false,
  port: 587,
  auth: {
    user: "julrich",
    pass: "jonasmeile123"
  }
});

var message = {
  from: "Outrun-Rennen <outrun@tsnm.de>",
  to: "tsnm.at.kllr@googlemail.com",
  subject: "Subject",
  text: "Outrun Infonachricht"
};

var sendInfoMail = function (subject, body) {
  var mail = message;
  mail.subject = subject;
  mail.text = body;

  smtpTransport.sendMail(mail, function(error, response){
    // if you don't want to use this transport object anymore, uncomment following line
    //smtpTransport.close(); // shut down the connection pool, no more messages
  });
};

// Startup server
server.listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});