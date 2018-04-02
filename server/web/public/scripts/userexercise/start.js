'use strict';

function start(numSets,numRepetition,setNumber) {

  var exerciseId =''; 

  const url = window.location.pathname.split('/');
  if (url.length === 5) {
    exerciseId = url[3];
  }
  else {
    exerciseId = url.pop(); 
  }
  window.location = '/userexercise/play/' + exerciseId +
  '/' + numSets + '/' + numRepetition + '/' + setNumber; 
}
