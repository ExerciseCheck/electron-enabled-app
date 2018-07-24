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
      $("#num").text("");
      $("#start").text("Time to start!");
      $("#cover").css("display", "none");
      var event = new Event('timer-done');
      document.dispatchEvent(event);
    } else {
      $("#num").text(time);
    }
  }, 100);
}

function openDB(callback) {
  req = window.indexedDB.open("bodyFrames", 1);

  req.onupgradeneeded = function(e) {
    console.log("Upgrade event triggered");
    db = e.target.result;
    let newObjectStore = db.createObjectStore('bodyFrames', {keyPath: 'type'});
  };

  req.onerror = (e) => {
    console.log('Database failed to open');
  };

  req.onsuccess = (e) => {
    console.log('Database opened successfully');
    db = req.result;
    callback();
  };

}
