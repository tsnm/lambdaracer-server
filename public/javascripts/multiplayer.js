var socket = io.connect(lambdaracer.current.host_url);

/* Socket event bindings */
socket.on('connect', function (data) {
  socket.emit('init', { fbid: lambdaracer.current.fbid, name: lambdaracer.current.name });
});

socket.on('ready', function (data) {
  console.log("server signalled ready");
});

socket.on('init', function (data) {
  updateLeaderBoard(data);
});

socket.on('first time play', function (data) {
  firstPlay = true;
});

socket.on('update leaderboard', function (data) {
  updateLeaderBoard(data);
});

socket.on('player connected', function (data) {
  addInfo(data.name+' hat ein Rennen gestartet!');
});

socket.on('new laptime', function (data) {
  addInfo(data.name+' hat eine neue Rundenzeit gefahren: '+formatTime(data.lapTime));
});

socket.on('new personal laptime', function (data) {
  updatePersonalBoard(
    "Neue Rundenzeit: " + formatTime(data.lapTime),
    "Leider keine neue persönliche Bestzeit, vielleicht diese Runde wieder? ;)"
  );
});

socket.on('new best time', function (data) {
  addInfo(data.name+' hat eine neue persönliche Bestzeit gefahren: '+formatTime(data.lapTime));
});

socket.on('new personal best time', function (data) {
  if(data.lapTime < 120) {
    updatePersonalBoard(
      "EINTRITT FREI!",
      "Das war unter 2 Minuten, meld dich einfach mit Namen an der Kasse am Samstag!"
    );
    postToWall("hat sich gerade mit einer Rundenzeit von " + formatTime(data.lapTime) + " freien Eintritt auf unserer Party ( http://www.facebook.com/events/326641780751708/ ) am Samstag erkämpft!");
  } else {
    updatePersonalBoard(
      "Neue persönliche Bestzeit!",
      "Jetzt noch unter 2.00.0 kommen, und der Eintritt ist garantiert frei!"
    );
    postToWall("hat gerade mit " + formatTime(data.lapTime) + " eine neue persönliche Bestzeit beim LAMBDA Renn- / Gewinnspiel für unsere nächste Party ( http://www.facebook.com/events/326641780751708/ ) aufgestellt!");
  }
});

socket.on('error', function (data) {
  console.log("Leider gab es einen Fehler :/");
  console.log(data);
});

socket.on('debug', function (data) {
  console.log("Debug Nachricht vom Server! Funky!");
  console.log(data);
});

/* Function declarations */
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
  var $ul = $('#leaderboard ul'),
      players = data.result;
      html = "";

  $.each(players, function (index, player) {
    if(data.player && (data.player.fbid == player.fbid)) {
      html += "<li class='new_record' style='color: #F6358A'>"+(index+1)+". "+player.name+": <span class='time'>"+formatTime(player.time)+"</span></li>";
    } else {
      html += "<li>"+(index+1)+". "+player.name+": <span class='time'>"+formatTime(player.time)+"</span></li>";
    }
  });

  $ul.html(html);

  $('.new_record').animate({ color: "#000000" }, 5000, function () {
    $('.new_record').removeClass('new_record');
  });
};

var updatePersonalBoard = function (headline, text) {
  var $personalBoard = $('#personalboard');
  $personalBoard.html("<h1>"+headline+"</h1><p>"+text+"</p>");
  $personalBoard.show();

  $personalBoard.fadeOut(10000);
};