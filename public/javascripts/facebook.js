var initializeFB = function () {
	bindCloseButton();
};

var checkPermissions = function (callback) {
  FB.api('/me/permissions', function (response) {
    if(!response || !response.data || !response.data[0])
      reRequestPermissions(lambdaracer.current.required_permissions, callback);

    var perms = response.data[0],
        missing_perms = [];

    $.each(lambdaracer.current.required_permissions, function (index, permission) {
      if(!perms[permission])
        missing_perms.push(permission);
    });

    if(missing_perms.length) {
      reRequestPermissions(missing_perms, callback);
    } else {
      callback();
    }
  });
};

var reRequestPermissions = function (permissions, callback) {
  FB.login(function (response) {
    if (response.authResponse) {
      checkPermissions(callback);
    } else {
      reRequestPermissions(permissions, callback);
    }
  }, { scope: permissions.join() });
};

var postToWall = function (message) {
  var params = {};
  params.message = message;
  params.name = 'LAMBDA Outrun-Edition';
  params.description = 'Online-Rennspiel: Sei unter den besten, oder unter 2 Minuten, und gewinne freien Eintritt für kommenden Samstag!';
  params.link = 'http://facebook.com/lambda.maximal/app_260510290719654';
  params.picture = 'http://lambda-racer.nodejitsu.com/images/thumb_fb.png';
  params.caption = 'Eintritt für die Party am Samstag gewinnen';

  FB.api('/me/feed', 'post', params, function (response) {
    // no handling needed for now
  });
};

var attendEvent = function () {
  FB.api('/326641780751708/attending', "post", {}, function (response) {
    // no handling needed for now
  });
};