'use strict';

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
      //window.location = redirectToUrl
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
      //window.location = redirectToUrl
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function changeSetting() {
  
  const pathToArray = window.location.pathname.split('/');
  const exerciseId = pathToArray[3];
  const patientId = pathToArray[4];
  const numSets = $("#numSets").val();
  const numReps = $("#numReps").val();
  const url = '/userexercise/setting/' + exerciseId +'/' + patientId; 
  
  $.get('/api/userexercise/reference/' + exerciseId + '/' + patientId, function(data){
    
    if ( data.settingIsUpdated ) {
      updateSetting(numSets, numReps, exerciseId, patientId, url);
      console.log("here1");
    }

    else {
      initialSetting(numSets, numReps, exerciseId, patientId, url);
      console.log("here2");
    }     
  
  });
}

function createRef() {

  const pathToArray = window.location.pathname.split('/');
  const exerciseId = pathToArray[3];
  const patientId = pathToArray[4];
  const url = '/api/userexercise/reference/' + exerciseId + '/' + patientId;
  const redirectToUrl = '/userexercise/session/start/reference/' + exerciseId + '/' + patientId;
  
  $.get(url, function(data){
    
    if ( data.settingIsUpdated ) {
      window.location = redirectToUrl;
    }

    else {
      initialSetting(1, 1, exerciseId, patientId, url);
       window.location = redirectToUrl;
    }     
  
  });
}

function viewReferences() {

  const pathToArray = window.location.pathname.split('/');
  const patientId = pathToArray[4];

  window.location = '/userexercise/reference/' + patientId;

}


