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


function action(action) {

  const parsedURL = parseURL(window.location.pathname);
  var patientId = parsedURL.patientId;
  var exerciseId = parsedURL.exerciseId;
   
  if ( action === 'start') {
    window.location = (parsedURL.patientId !== null)? 
    '/userexercise/session/play/' + exerciseId + '/' + patientId:
    '/userexercise/session/play/' + exerciseId;                                                  
  }

  if ( action === 'discard' ) {
    window.location = (parsedURL.patientId !== null)? 
    '/userexercise/session/start/' + exerciseId + '/' + patientId:
    '/userexercise/session/start/' + exerciseId;                                                  
  } 
 

  else if ( action === 'stop' ) {
    window.location = (parsedURL.patientId !== null)? 
    '/userexercise/session/stop/' + exerciseId + '/' + patientId:
    '/userexercise/session/stop/' + exerciseId;             
  }
}

 

