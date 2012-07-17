/*****************
 * GET home page.
 *****************/

exports.index = function(req, res) {
  if(!req.facebook || !req.facebook.signed_request || !req.facebook.signed_request.user_id) {
    res.render('appauth', { title: 'Authentication' });
  } else {
    var fbid = req.facebook.signed_request.user_id;
    res.expose({ fbid: fbid }, "lambdaracer.current");

    req.facebook.fql("SELECT name FROM user WHERE uid = me()", function (result) {
      res.expose({ name: result[0].name.split(" ")[0] }, "lambdaracer.current");

      res.render('index', { title: 'Racer' });
    });
  }
};