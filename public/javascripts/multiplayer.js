var socket = io.connect('http://localhost:1338');

socket.on('connect', function (data) {
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

var updateScoreOnServer = function (newLapTime) {
  console.log("NEW LAPTIME!!!")
  console.log(newLapTime);
  socket.emit('update laptime', { lapTime: newLapTime });
};