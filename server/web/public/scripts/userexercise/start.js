'use strict';

function start() {
  
  const exerciseId = window.location.pathname.split('/').pop();
  window.location = '/userexercise/play/' + exerciseId
}
