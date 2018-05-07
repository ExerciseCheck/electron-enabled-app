'use strict';

function parseURL(url) {

  var exerciseId = null;
  var patientId = null;
  const urlToArray = url.split('/');
  
  //logged-in user is a patient
  if (urlToArray.length === 6) {
    exerciseId = urlToArray[4];
    patientId = urlToArray[5];
  }
  
  //logged-in user is a clinician
  else if (urlToArray.length === 5) {
    exerciseId = urlToArray.pop();
    patientId = null;
  }

  return {
    patientId: patientId,
    exerciseId: exerciseId
  };
}


function action(nextMode) {
  
  
  const parsedURL = parseURL(window.location.pathname);
  var patientId = parsedURL.patientId;
  var exerciseId = parsedURL.exerciseId;

 window.location = (parsedURL.patientId !== null)? 
 '/userexercise/session/' + nextMode + '/' + exerciseId + '/' + patientId:
 '/userexercise/session/' + nextMode + '/' + exerciseId;                                                  
   
}

 

