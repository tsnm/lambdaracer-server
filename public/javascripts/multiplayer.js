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
      "Das war unter 2 Minuten, damit wärste am 21.07. umsonst drin gewesen, schade! ;)"
    );
  } else {
    updatePersonalBoard(
      "Neue persönliche Bestzeit!",
      "Jetzt noch unter 2.00.0 kommen, und der Eintritt am 21.07. wäre frei gewesen! ;)"
    );
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
  console.log(data);
  var $leaderboard = $('#leaderboard'),
      players = data.result;
      html = "";
  var excluded = [],
      underTwo = [],
      bestFive = [];

  players.sort(sortByTime);
  console.log(players);
  $.each(players, function (index, player) {
    var playerFixed = player;

    if(player.fbid === "100002146898225") {
      playerFixed.name = "Gunther Affe";
      excluded.push(playerFixed);
    } else if (player.fbid === "100000529285495") {
      playerFixed.name = "Bassador";
      excluded.push(playerFixed);
    } else if (player.fbid === "1099911102") {
      playerFixed.name = "tsnm";
      excluded.push(playerFixed);
    } else if (player.fbid === "100000015080286") {
      playerFixed.name = "ELEKTROLOK";
      excluded.push(playerFixed);
    } else if(player.time < 120) {
      underTwo.push(player);
    } else {
      if(bestFive.length < 5) {
        bestFive.push(player);
      }
    }
  });

  excluded.sort(sortByTime);
  underTwo.sort(sortByTime);
  bestFive.sort(sortByTime);

  html += "<span>Ausser Wertung:</span><ul>";
  $.each(excluded, function (index, player) {
    if(data.player && (data.player.fbid == player.fbid)) {
      html += "<li class='new_record' style='color: #F6358A'>"+(index+1)+". "+player.name+": <span class='time'>"+formatTime(player.time)+"</span></li>";
    } else {
      html += "<li>"+(index+1)+". "+player.name+": <span class='time'>"+formatTime(player.time)+"</span></li>";
    }
  });
  html += "</ul>";

  html += "<span>Unter 2 Minuten*:</span><ul>";
  $.each(underTwo, function (index, player) {
    if(data.player && (data.player.fbid == player.fbid)) {
      html += "<li class='new_record' style='color: #F6358A'>"+(index+1)+". "+player.name+": <span class='time'>"+formatTime(player.time)+"</span></li>";
    } else {
      html += "<li>"+(index+1)+". "+player.name+": <span class='time'>"+formatTime(player.time)+"</span></li>";
    }
  });
  html += "</ul>";

  html += "<span>Beste 5 über 2 Minuten*:</span><ul>";
  $.each(bestFive, function (index, player) {
    if(data.player && (data.player.fbid == player.fbid)) {
      html += "<li class='new_record' style='color: #F6358A'>"+(index+1)+". "+player.name+": <span class='time'>"+formatTime(player.time)+"</span></li>";
    } else {
      html += "<li>"+(index+1)+". "+player.name+": <span class='time'>"+formatTime(player.time)+"</span></li>";
    }
  });
  html += "</ul><span>*Eintritt+1 frei</span>";

  $leaderboard.html(html);

  $('.new_record').animate({ color: "#000000" }, 5000, function () {
    $('.new_record').removeClass('new_record');
  });
};

var sortByTime = function (a, b) {
  var aTime = a.time;
  var bTime = b.time;
  return (aTime < bTime) ? -1 : ((aTime > bTime) ? 1 : 0);
};

var updatePersonalBoard = function (headline, text) {
  var $personalBoard = $('#personalboard');
  $personalBoard.html("<h1>"+headline+"</h1><p>"+text+"</p>");
  $personalBoard.show();

  $personalBoard.fadeOut(10000);
};