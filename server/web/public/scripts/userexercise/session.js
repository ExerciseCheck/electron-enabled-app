'use strict';

function start() {

  var exerciseId ='';
  var patientId = '';
   
  const url = window.location.pathname.split('/');
  if (url.length === 6) {
    exerciseId = url[4];
    patientId = url[5];
    window.location = '/userexercise/session/play/' + exerciseId +
                      '/' + patientId;
  }
  else if (url.length === 5 ) {
    exerciseId = url.pop();
    window.location = '/userexercise/session/play/' + exerciseId;
    
  }
  
}

function stop() {

  var exerciseId ='';
  var patientId = ''; 

  const url = window.location.pathname.split('/');
  if (url.length === 6) {
    exerciseId = url[4];
    patientId = url[5];
    window.location = '/userexercise/session/stop/' + exerciseId +
                      '/' + patientId;
  }
  else if (url.length === 5 ) {
    exerciseId = url.pop();
    window.location = '/userexercise/session/stop/' + exerciseId;
    
  }
}  
  
  
