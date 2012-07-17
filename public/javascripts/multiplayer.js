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
  addInfo('Du hast ein Rennen gestartet!');

  updateLeaderBoard(data);
});

socket.on('update leaderboard', function (data) {
  // do stuff with leaderboard data
  console.log("update leaderboard");
  console.log(data);

  updateLeaderBoard(data);
});

socket.on('player connected', function (data) {
  addInfo(data.name+' hat ein Rennen gestartet!');
});

socket.on('new laptime', function (data) {
  addInfo(data.name+' hat eine neue Rundenzeit gefahren: '+formatTime(data.lapTime));
});

socket.on('new best time', function (data) {
  addInfo(data.name+' hat eine neue persönliche Bestzeit gefahren: '+formatTime(data.lapTime));
});

socket.on('error', function (data) {
  console.log("damn, there was an error");
  console.log(data);
});

socket.on('debug', function (data) {
  console.log("debug message received");
  console.log(data);
});

var updateScoreOnServer = function (newLapTime) {
  socket.emit('update laptime', { lapTime: newLapTime });
};

var addInfo = function (string) {
  var $ul = $('#info ul');
  $ul.append('<li class="new_info" style="color: #F6358A">'+string+'</li>');
  $ul.children('li:last').animate({ color: "#000000" }, 5000, function () {
    $('.new_info').removeClass('new_info');
  });

  if($ul.children('li').length > 7) {
    $ul.children('li:first').remove();
  }
};

var updateLeaderBoard = function (data) {
  console.log(data);

  var $ul = $('#leaderboard ul'),
      players = data.result;
      html = "";

  $.each(players, function (index, player) {
    if(data.player && (data.player.fbid == player.fbid)) {
      html += "<li class='new_record' style='color: #F6358A'>"+index+". "+player.name+": "+formatTime(player.time)+"</li>";
    } else {
      html += "<li>"+(index+1)+". "+player.name+": "+formatTime(player.time)+"</li>";
    }
  });

  $ul.html(html);

  $('.new_record').animate({ color: "#000000" }, 5000, function () {
    $('.new_record').removeClass('new_record');
  });
};