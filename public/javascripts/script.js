$(function () {
  /* Bind handler to howto-close button */
  $('#submit').on('click', function (event) {
    event.preventDefault();

    checkPermissions(function () {
      $('#howto').hide();
      addInfo('Du hast ein Rennen gestartet!');
      window.scrollTo(0, 0);
    });

    return false;
  });

  /* Prevent scrolling with arrow and page keys */
  var ar=new Array(33,34,35,36,37,38,39,40);
  $(document).keydown(function(e) {
    var key = e.which;
    if($.inArray(key,ar) > -1) {
      e.preventDefault();
      return false;
    }
    return true;
  });
});