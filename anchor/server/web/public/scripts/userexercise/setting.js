'use strict';

let req, db;

function getExerciseId() {

  return (window.location.pathname.split('/'))[3];
}

function getPatientId() {

  return (window.location.pathname.split('/'))[4];
}

function initialSetting(numSets, numReps, diffLevel, exerciseId, patientId, redirectToUrl) {

  const values = {};
  values.exerciseId = exerciseId;
  values.userId = patientId;
  values.numSets = numSets;
  values.numRepetition = numReps;
  values.diffLevel = diffLevel;

  $.ajax({
    type: 'POST',
    url: '/api/userexercise/reference',
    data: values,
    success: function (result) {
        successAlert('Setting successfully updated');
        if(redirectToUrl) {
          loadReferenceandStart('reference');
        }
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function initializePractice() {

  const values = {};
  values.exerciseId = getExerciseId();
  values.weekStart = new Date().getWeekNumber();
  $.ajax({
    type: 'POST',
    url: '/api/userexercise/practice/' + getPatientId(),
    data: values,
    success: function (result) {
        successAlert('Starting new practice session');
        loadReferenceandStart('practice');
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function updateSetting(numSets, numReps, diffLevel, exerciseId, patientId) {

  const values = {};
  values.exerciseId = exerciseId;
  values.userId = patientId;
  values.numSets = numSets;
  values.numRepetition = numReps;
  values.diffLevel = diffLevel;

  //updating settings creates a new reference document with the latest reference bodyframes
  $.ajax({
    type: 'POST',
    url: '/api/userexercise/reference',
    data: values,
    success: function (result) {
        successAlert('Setting successfully updated');
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

//when there's no reference update setting can do both inserting or updating
function changeSetting() {

  const numSets = $("#numSets").val();
  const numReps = $("#numReps").val();
  const diffLevel = $("#diffLevel").val();

  //const url = '/userexercise/setting/' + getExerciseId() +'/' + getPatientId();

  $.get('/api/userexercise/reference/' + getExerciseId() + '/' + getPatientId(), function(data){

    if ( data.settingIsUpdated ) {
      updateSetting(numSets, numReps, diffLevel, getExerciseId(), getPatientId());
    }

    else {
      initialSetting(numSets, numReps, diffLevel, getExerciseId(), getPatientId());
    }
  });
}

function update() {

  const numSets = $("#numSets").val();
  const numReps = $("#numReps").val();
  const diffLevel = $("#diffLevel").val();

  //const url = '/userexercise/setting/' + getExerciseId() +'/' + getPatientId();
  updateSetting(numSets, numReps, diffLevel, getExerciseId(), getPatientId());
}

function createRef() {

  const url = '/api/userexercise/reference/' + getExerciseId() + '/' + getPatientId();
  const redirectToUrl = '/userexercise/session/start/reference/' +
                            getExerciseId() + '/' + getPatientId();

  $.get(url, function(data){

    if ( data.settingIsUpdated ) {
      loadReferenceandStart('reference');
    }

    else {
      initialSetting(1, 1, 0.75, getExerciseId(), getPatientId(), redirectToUrl);
    }
  });
}

function viewReferences() {

  window.location = '/userexercise/reference/' + getPatientId();
}

function updateReference() {
  const numSets = $("#numSets").val();
  const numReps = $("#numReps").val();
  const diffLevel = $("#diffLevel").val();

  const url = '/api/userexercise/loadreference/' + getExerciseId() + '/' + getPatientId();
  const redirectToUrl = '/userexercise/session/start/' + 'reference' + '/' +
    getExerciseId() + '/' + getPatientId();

  $.get(url, function(data){
    openDB(function() {
      let refEntry = {type: 'refFrames', body: data};
      let bodyFramesStore = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames');
      let req = bodyFramesStore.put(refEntry);
      req.onsuccess = function(e) {
        initialSetting(numSets, numReps, diffLevel, getExerciseId(), getPatientId(), redirectToUrl);
      };
    });
  });
}

//TODO: everytime we start exercise a new document is created but it could be empty
function StartPracticeSession() {

  const url = '/api/userexercise/practice/' + getExerciseId() + '/' + getPatientId();
  // $.get(url, function(data) {
  //   if (data === true) {
  //     loadReferenceandStart('practice');
  //   }
  //   else {
  //     initializePractice();
  //   }
  // });
  initializePractice();
}

function loadReferenceandStart(type) {
  const url = '/api/userexercise/loadreference/' + getExerciseId() + '/' + getPatientId();
  $.get(url, function(data){
    openDB(function() {
      let refEntry = {type: 'refFrames', body: data};
      let bodyFramesStore = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames');
      let req = bodyFramesStore.put(refEntry);
      req.onsuccess = function(e) {
        redirect(type);
      };
    });
  });
}

function redirect(type) {
  window.location = '/userexercise/session/start/' + type + '/' +
    getExerciseId() + '/' + getPatientId();
}

