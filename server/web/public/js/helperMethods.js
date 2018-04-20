'use strict';

function storageAvailable(type) {

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
}

function createStorageObject(storage, key, val) {

  if (storageAvailable('localStorage')){
    const storage = window.localStorage;
    if (storage.setItem(key, val)){
      return true;
  }}
  return false;
}
