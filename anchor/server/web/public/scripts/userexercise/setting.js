'use strict';

function getExerciseId() {

  return (window.location.pathname.split('/'))[3];
}

function getPatientId() {

  return (window.location.pathname.split('/'))[4];
}

function initialSetting(numSets, numReps, exerciseId, patientId, redirectToUrl) {

  const values = {};
  values.exerciseId = exerciseId;
  values.userId = patientId;
  values.numSessions = numSets;
  values.numRepetition = numReps;

  $.ajax({
    type: 'POST',
    url: '/api/userexercise/reference',
    data: values,
    success: function (result) {
        successAlert('Setting successfully updated');
      window.location = redirectToUrl;
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function updateSetting(numSets, numReps, exerciseId, patientId, redirectToUrl) {

  const values = {};
  values.numSessions = numSets;
  values.numRepetition = numReps;

  $.ajax({
    type: 'PUT',
    url: '/api/userexercise/reference/mostrecent/setting/' + exerciseId +'/' + patientId,
    data: values,
    success: function (result) {
       successAlert('Setting successfully updated');
      //window.location = redirectToUrl;
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
  const url = '/userexercise/setting/' + getExerciseId() +'/' + getPatientId();

  $.get('/api/userexercise/reference/' + getExerciseId() + '/' + getPatientId(), function(data){

    if ( data.settingIsUpdated ) {
      updateSetting(numSets, numReps, getExerciseId(), getPatientId(), url);
    }

    else {
      initialSetting(numSets, numReps, getExerciseId(), getPatientId());
    }
  });
}

//when there is a reference meaning a reference is recorded update setting just updates
function update() {

  const numSets = $("#numSets").val();
  const numReps = $("#numReps").val();
  const url = '/userexercise/setting/' + getExerciseId() +'/' + getPatientId();
  updateSetting(numSets, numReps, getExerciseId(), getPatientId(), url);
}

function createRef() {

  const url = '/api/userexercise/reference/' + getExerciseId() + '/' + getPatientId();
  const redirectToUrl = '/userexercise/session/start/reference/' +
                            getExerciseId() + '/' + getPatientId();

  $.get(url, function(data){

    if ( data.settingIsUpdated ) {
      console.log("Setting exists");
      //window.location = redirectToUrl;
    }

    else {
      console.log("New reference object created");
      initialSetting(1, 1, getExerciseId(), getPatientId(), redirectToUrl);
      //window.location = redirectToUrl;
    }
  });
}

function viewReferences() {

  window.location = '/userexercise/reference/' + getPatientId();
}

function updateReference() {
  loadReferenceandStart('reference');
}

function StartPracticeSession() {
  loadReferenceandStart('practice');
}

function loadReferenceandStart(type) {
  const url = '/api/userexercise/loadreference/' + getExerciseId() + '/' + getPatientId();
  $.get(url, function(data){
    console.log("Get from CLINICIAN side");
    localStorage.setItem("refFrames", JSON.stringify(data));
    redirect(type);
  });
}

function redirect(type) {
  window.location = '/userexercise/session/start/' + type + '/' +
    getExerciseId() + '/' + getPatientId();
}




