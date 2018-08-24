'use strict';

let req, db;

function getExerciseId() {

  return (window.location.pathname.split('/'))[3];
}

function getPatientId() {

  return (window.location.pathname.split('/'))[4];
}

Date.prototype.getWeekNumber = function(){
  var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};

function initialSetting(numSets, numReps, rangeScale, exerciseId, patientId, redirectToUrl) {

  rangeScale = 0.7 // comment this out

  const values = {};
  values.exerciseId = exerciseId;
  values.userId = patientId;
  values.numSets = numSets;
  values.numRepetition = numReps;
  values.rangeScale = rangeScale;
  values.topThresh = 0.25; // default values
  values.bottomThresh = 0.75; // defalut values
  // values.neckX = -1,
  // values.neckY = -1,
  // values.refMin = -1,
  // values.refMax = -1,
  // values.refLowerJoint = -1,
  // values.refUpperJoint = -1,
  // values.refTime = -1,

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

function updateSetting(numSets, numReps, rangeScale, exerciseId, patientId) {

  rangeScale = 0.7 // comment this out
  const values = {};
  values.exerciseId = exerciseId;
  values.userId = patientId;
  values.numSets = numSets;
  values.numRepetition = numReps;
  values.rangeScale = rangeScale;
  values.topThresh = 0.25; // dummy
  values.bottomThresh = 0.75;//dummy values

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
  //const rangeScale = $("rangeScale").val();
  const rangeScale = 0.7; //TODO: comment this out

  const url = '/userexercise/setting/' + getExerciseId() +'/' + getPatientId();

  $.get('/api/userexercise/reference/' + getExerciseId() + '/' + getPatientId(), function(data){

    if ( data.settingIsUpdated ) {
      updateSetting(numSets, numReps, rangeScale, getExerciseId(), getPatientId());
    }

    else {
      initialSetting(numSets, numReps, rangeScale, getExerciseId(), getPatientId());
    }
  });
}

function update() {

  const numSets = $("#numSets").val();
  const numReps = $("#numReps").val();
  //const rangeScale = $("rangeScale").val();
  const rangeScale = 0.7; //TODO: comment this out
  const url = '/userexercise/setting/' + getExerciseId() +'/' + getPatientId();
  updateSetting(numSets, numReps, rangeScale, getExerciseId(), getPatientId(), url); //TODO: no url??
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
      initialSetting(1, 1, 0.7, getExerciseId(), getPatientId(), redirectToUrl);
    }
  });
}

function viewReferences() {

  window.location = '/userexercise/reference/' + getPatientId();
}

function updateReference() {
  const numSets = $("#numSets").val();
  const numReps = $("#numReps").val();
  //const rangeScale = $("rangeScale").val();
  const rangeScale = 0.7; //TODO: comment this out

  const url = '/api/userexercise/loadreference/' + getExerciseId() + '/' + getPatientId();
  const redirectToUrl = '/userexercise/session/start/' + 'reference' + '/' +
    getExerciseId() + '/' + getPatientId();

  $.get(url, function(data){
    openDB(function() {
      let refEntry = {type: 'refFrames', body: data};
      let bodyFramesStore = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames');
      let req = bodyFramesStore.put(refEntry);
      req.onsuccess = function(e) {
        initialSetting(numSets, numReps, rangeScale, getExerciseId(), getPatientId(), redirectToUrl);
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



// //for smoothing test
// function plotData() {
//   let smoothingResult = {};
//
//   $.get('/api/userexercise/smoothingtest/' + getExerciseId() + '/' + getPatientId(), function(data){
//     smoothingResult = data;
//     localStorage.setItem("smoothingResult", JSON.stringify(data));
//   });
//
//   //TODO: WHY???
//   console.log("smoothing result: " + smoothingResult); //returns [object object]
//   console.log("result_str: " + JSON.stringify(smoothingResult)); //returns {}
//   console.log("smoothed: " + smoothingResult.t); //returns undefined
//   console.log("smoothed_str: " + JSON.stringify(smoothingResult.t)); //returns undefined
//
//   let smoothingLocalStg = JSON.parse(localStorage.getItem("smoothingResult"));
//   //console.log("result from localStorage: " + smoothingLocalStg.smoothed);
//
//   var trace0 = {
//     x: smoothingLocalStg.t,
//     y: smoothingLocalStg.raw,
//     type: 'scatter'
//   };
//   var trace1 = {
//     x: smoothingLocalStg.t,
//     y: smoothingLocalStg.smoothedAvg,
//     type: 'scatter'
//   };
//   var trace2 = {
//     x: smoothingLocalStg.t,
//     y: smoothingLocalStg.smoothedTri,
//     type: 'scatter'
//   };
//   var trace3 = {
//     x: smoothingLocalStg.t,
//     y: smoothingLocalStg.smoothedGauss,
//     type: 'scatter'
//   };
//
//   console.log(trace0.t);
//   var data = [trace0, trace1, trace2, trace3];
//
//   var layout = {
//     yaxis: {rangemode: 'tozero',
//       showline: true,
//       zeroline: true}
//   };
//
//   Plotly.newPlot('plot', data, layout);
//
// }
