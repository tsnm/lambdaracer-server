var socket = io.connect(lambdaracer.current.host_url);

socket.on('connect', function (data) {
  console.log(lambdaracer.current.fbid);
  console.log(lambdaracer.current.name);
  socket.emit('init', { fbid: lambdaracer.current.fbid, name: lambdaracer.current.name });
});

socket.on('ready', function (data) {
  console.log("fbid set on server");
});

socket.on('init', function (data) {
  // do init stuff here, e.g. initial leader board
});

socket.on('player connected', function (name) {

});

socket.on('error', function (data) {
  console.log("damn, there was an error");
  console.log(data);
});

var updateScoreOnServer = function (newLapTime) {
  console.log('update laptime to: ' + newLapTime); // TODO debug to see if early lapTime emit causes connection error

  socket.emit('update laptime', { lapTime: newLapTime });
};