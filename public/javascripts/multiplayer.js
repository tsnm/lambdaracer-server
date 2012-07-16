var socket = io.connect(lambdaracer.current.host_url);

socket.on('connect', function (data) {
  socket.emit('init', { fbid: lambdaracer.current.fbid });
});

socket.on('ready', function (data) {
  console.log("fbid set on server");
});

socket.on('init', function (data) {
});

socket.on('error', function (data) {
  console.log("damn, there was an error");
  console.log(data);
});

var updateScoreOnServer = function (newLapTime) {
  socket.emit('update laptime', { lapTime: newLapTime });
};