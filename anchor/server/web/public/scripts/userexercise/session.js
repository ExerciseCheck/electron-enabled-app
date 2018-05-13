'use strict';

function parseURL(url) {

  var exerciseId = null;
  var patientId = null;
  const urlToArray = url.split('/');
   
  //logged-in user is a clinician
  if (urlToArray.length === 7) {
    exerciseId = urlToArray[5];
    patientId = urlToArray[6];
  }
  
  //logged-in user is a patient
  else if (urlToArray.length === 6) {
    exerciseId = urlToArray.pop();
    patientId = null;
  }

  return {
    patientId: patientId,
    exerciseId: exerciseId
  };
}


function action(nextMode, type) {
  
  const parsedURL = parseURL(window.location.pathname);
  var patientId = parsedURL.patientId;
  var exerciseId = parsedURL.exerciseId;

 window.location = (parsedURL.patientId !== null)? 
 '/userexercise/session/' + nextMode + '/' + type + '/' + exerciseId + '/' + patientId:
 '/userexercise/session/' + nextMode + '/' + type + '/' + exerciseId;                                                  
}

function saveReference() {

  const pathToArray = window.location.pathname.split('/');
  const exerciseId = pathToArray[5];
  const patientId = pathToArray[6];
  
  window.location = '/userexercise/setting/' + exerciseId +'/' + patientId; 
}

 
 

