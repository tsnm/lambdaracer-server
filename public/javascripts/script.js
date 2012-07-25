var firstPlay = false;

$(function () {
  /* Prevent scrolling with arrow and page keys */
  var ar = new Array(33,34,35,36,37,38,39,40);
  $(document).keydown(function (e) {
    var key = e.which;
    if($.inArray(key,ar) > -1) {
      e.preventDefault();
      return false;
    }
    return true;
  });
});

var bindCloseButton = function () {
  // Defer until Dom.ready, otherwise button will not be there yet
  console.log("in bindCloseButton");
  $(function () {
    console.log("in DomReady in bindCloseButton");
    /* Bind handler to howto-close button */
    $('#submit').removeAttr('disabled')
        .on('click', function (event) {
      console.log("callback for click in bindCloseButton");
      event.preventDefault();

      checkPermissions(function () {
        $('#howto').hide();
        addInfo('Du hast ein Rennen gestartet!');
        window.scrollTo(0, 0);
      });

      return false;
    });
  });
};