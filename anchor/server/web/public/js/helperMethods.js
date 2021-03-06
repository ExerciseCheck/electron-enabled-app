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

Date.prototype.getWeekNumber = function(){
  var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};
