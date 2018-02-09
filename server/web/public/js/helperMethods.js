// function to make object
'use strict';

const internals = {};

internals.storageAvailable = function storageAvailable(type) {

  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch (e){
    return e;
  }
};

internals.createStorageObject = function createStorageObject() {

  if (internals.storageAvailable('localStorage')){
    const storage = window.localStorage;
    return storage;
  }
  return false;
};

internals.setKeyVal = function setKeyVal(storage, key, val){

  storage.setItem(key, val);
};
