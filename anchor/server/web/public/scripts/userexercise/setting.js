'use strict';

function getExerciseId() {

  return (window.location.pathname.split('/'))[3];
}

function getPatientId() {

  return (window.location.pathname.split('/'))[4];
}

function initialSetting(numSets, numReps, impJoint, impAxis, direction, lowerJoint, upperJoint, exerciseId, patientId, redirectToUrl) {

  const values = {};
  values.exerciseId = exerciseId;
  values.userId = patientId;
  values.numSessions = numSets;
  values.numRepetition = numReps;
  values.impJoint = impJoint;
  values.impAxis = impAxis;
  values.direction = direction;
  values.lowerJoint = lowerJoint;
  values.upperJoint = upperJoint;

  $.ajax({
    type: 'POST',
    url: '/api/userexercise/reference',
    data: values,
    success: function (result) {
        successAlert('Setting successfully updated');
        if(redirectToUrl) {
          window.location = redirectToUrl;
        }
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function updateSetting(numSets, numReps, impJoint, impAxis, direction, lowerJoint, upperJoint, exerciseId, patientId) {

  const values = {};
  values.numSessions = numSets;
  values.numRepetition = numReps;
  values.impJoint = impJoint;
  values.impAxis = impAxis;
  values.direction = direction;
  values.lowerJoint = lowerJoint;
  values.upperJoint = upperJoint;

  $.ajax({
    type: 'PUT',
    url: '/api/userexercise/reference/mostrecent/setting/' + exerciseId +'/' + patientId,
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
  const impJoint = $("#impJoint").val();
  const impAxis = $("#impAxis").val();
  const direction = $("#direction").val();
  const lowerJoint = $("#lowerJoint").val();
  const upperJoint = $("#upperJoint").val();
  const url = '/userexercise/setting/' + getExerciseId() +'/' + getPatientId();

  $.get('/api/userexercise/reference/' + getExerciseId() + '/' + getPatientId(), function(data){

    if ( data.settingIsUpdated ) {
      updateSetting(numSets, numReps, impJoint, impAxis, direction, lowerJoint, upperJoint, getExerciseId(), getPatientId());
    }

    else {
      initialSetting(numSets, numReps, impJoint, impAxis, direction, lowerJoint, upperJoint, getExerciseId(), getPatientId());
    }
  });
}

//when there is a reference meaning a reference is recorded update setting just updates
function update() {

  const numSets = $("#numSets").val();
  const numReps = $("#numReps").val();
  const impJoint = $("#impJoint").val();
  const impAxis = $("#impAxis").val();
  const direction = $("#direction").val();
  const lowerJoint = $("#lowerJoint").val();
  const upperJoint = $("#upperJoint").val();
  const url = '/userexercise/setting/' + getExerciseId() +'/' + getPatientId();
  updateSetting(numSets, numReps, impJoint, impAxis, direction, lowerJoint, upperJoint, getExerciseId(), getPatientId(), url);
}

function createRef() {

  const url = '/api/userexercise/reference/' + getExerciseId() + '/' + getPatientId();
  const redirectToUrl = '/userexercise/session/start/reference/' +
                            getExerciseId() + '/' + getPatientId();

  $.get(url, function(data){

    if ( data.settingIsUpdated ) {
      window.location = redirectToUrl;
    }

    else {
      // FIX-ME: Are these hard-coded values correct? Why are these hard-coded?
      initialSetting(1, 1, 20, 'depthY', 'down', 0, 20, getExerciseId(), getPatientId(), redirectToUrl);
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
