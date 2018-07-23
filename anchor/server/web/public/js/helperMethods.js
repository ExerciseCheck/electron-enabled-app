'use strict';

function storageAvailable(type) {

  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch (e) {
    return false;
  }
};

function createStorageObject(storage, key, val) {

  if (storageAvailable('localStorage')) {
    const storage = window.localStorage;
    if (storage.setItem(key, val)) {
      return true;
    }
    return false;
  }
}
function startTimer() {
  var start = Date.now();
  var timer = setInterval(function () {
  var delta = Date.now() - start;
  var time = window.CONFIG.TIMER_MAX - Math.floor(delta / 1000);
    if (time <= 0) {
      clearInterval(timer);
      $("#timerStart").attr("class", "greenColor small");
      $("#timerStart").text("Recording has begun");
      $("#num").text("");
      localStorage.setItem('canStartRecording', true);
      var event = new Event('timer-done');
      document.dispatchEvent(event);
    } else {
      $("#timerStart").text("Recording will begin in...");
      $("#num").text(time);
    }
  }, 100);
}
