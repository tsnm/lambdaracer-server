var beatOffset = 0;

(function () {
  var
    AUDIO_FILE = '/music/racer',
    dancer, beat;

  // Dancer.js magic
  Dancer.setOptions({
    flashSWF : '/lib/soundmanager2.swf',
    flashJS  : '/lib/soundmanager2.js'
  });

  dancer = new Dancer(AUDIO_FILE, ['ogg', 'mp3']);
  beat = dancer.createBeat({
    onBeat: function () {
      beatOffset = 100;
    },
    offBeat: function () {
    }
  }).on();
  //dancer.fft( fft, { fillStyle: '#666' });

  Dancer.isSupported() || loaded();
  !dancer.isLoaded() ? dancer.bind( 'loaded', loaded ) : loaded();

  /*
   * Loading
   */

  function loaded () {
    var supported = Dancer.isSupported();

    if (supported) {
		  dancer.play();
    }
  }

  // For debugging
  window.dancer = dancer;
})();