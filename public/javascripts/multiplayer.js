var socket = io.connect('http:'+lambdaracer.current.host_url);

socket.on('connect', function (data) {
  console.log("we have a connect!");
  socket.emit('init', { fbid: lambdaracer.current.fbid });
});

socket.on('ready', function(data) {
  console.log("fbid set on server");
});

socket.on('init', function (data) {
  console.log("init");
  console.log(data);
});

socket.on('error', function (data) {
  console.log("damn, there was an error");
});

socket.on('test', function (data) {
  console.log("TEST WAS EMITTED!");
  console.log(data);
});

var updateScoreOnServer = function (newLapTime) {
  console.log("NEW LAPTIME!!!");
  console.log(newLapTime);
  socket.emit('update laptime', { lapTime: newLapTime });
};