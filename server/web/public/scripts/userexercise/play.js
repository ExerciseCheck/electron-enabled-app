'use strict';

function stop(numSets,numRepetition,setNumber) {
  
  const url = window.location.pathname.split('/');
  const exerciseId = url[3];
  console.log(url);
  window.location = '/userexercise/stop/' + exerciseId + '/' 
         + numSets + '/' + numRepetition + '/' + setNumber; 
}
