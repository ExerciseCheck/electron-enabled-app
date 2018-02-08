// function to make object
'use strict';

const internals = {};

internals.storageAvailable = function storageAvailable(type, window) {

  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch (e){
    return e instanceof DOMException && (
    // everything except Firefox
    e.code === 22 ||
    // Firefox
    e.code === 1014 ||
    // test name field too, because code might not be present
    // everything except Firefox
    e.name === 'QuotaExceededError' ||
    // Firefox
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
    // acknowledge QuotaExceededError only if there's something already stored
    storage.length !== 0;
  }
};

internals.createStorageObject = function createStorageObject(window) {

  if (internals.storageAvailable('localStorage')){
    const storage = window.localStorage;
    return storage;
  }
  return false;
};

internals.setKeyVal = function setKeyVal(storage, key, val){

  storage.setItem(key, val);
};


exports.register = function (server, options, next) {

  server.expose('createStorageObject', internals.createStorageObject);
  server.expose('setKeyVal', internals.setKeyVal);

  next();
};

exports.register.attributes = {
  name: 'helper_test'
};

