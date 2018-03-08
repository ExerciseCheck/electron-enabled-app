'use strict';

function stop() {
  
  const exerciseId = window.location.pathname.split('/').pop();
  window.location = '/userexercise/stop/' + exerciseId
}
