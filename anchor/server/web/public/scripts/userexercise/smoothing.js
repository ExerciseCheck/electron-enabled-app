'use strict';

console.log("HERE");

var trace0 = {
  x: smoothed_data.t,
  y: smoothed_data.raw,
  type: 'scatter'
};
var trace1 = {
  x: smoothed_data.t,
  y: smoothed_data.smoothedAvg,
  type: 'scatter'
};
var trace2 = {
  x: smoothed_data.t,
  y: smoothed_data.smoothedTri,
  type: 'scatter'
};
var trace3 = {
  x: smoothed_data.t,
  y: smoothed_data.smoothedGauss,
  type: 'scatter'
};

console.log(trace0.t);
var data = [trace0, trace1, trace2, trace3];

var layout = {
  yaxis: {rangemode: 'tozero',
    showline: true,
    zeroline: true}
};

Plotly.newPlot('plot', data, layout)



function getExerciseId() {
  return (window.location.pathname.split('/'))[3];
}

function getPatientId() {
  return (window.location.pathname.split('/'))[4];
}

function viewPlot() {
  window.location = '/userexercise/smoothing/' + getExerciseId() + '/' + getPatientId();
}

//for smoothing test
function plotData(smoothed_data) {

  window.location = '/userexercise/smoothing/' + getExerciseId() + '/' + getPatientId();

  let smoothingResult = {};

  $.get('/api/userexercise/smoothing/' + getExerciseId() + '/' + getPatientId(), function(data){
    smoothingResult = data;
    localStorage.setItem("smoothingResult", JSON.stringify(data));
  });

  //TODO: WHY???
  console.log("smoothing result: " + smoothingResult); //returns [object object]
  console.log("result_str: " + JSON.stringify(smoothingResult)); //returns {}
  console.log("smoothed: " + smoothingResult.t); //returns undefined
  console.log("smoothed_str: " + JSON.stringify(smoothingResult.t)); //returns undefined

  let smoothingLocalStg = JSON.parse(localStorage.getItem("smoothingResult"));
  localStorage.removeItem("smoothingResult");
  //console.log("result from localStorage: " + smoothingLocalStg.smoothed);

  var trace0 = {
    x: smoothingLocalStg.t,
    y: smoothingLocalStg.raw,
    type: 'scatter'
  };
  var trace1 = {
    x: smoothingLocalStg.t,
    y: smoothingLocalStg.smoothedAvg,
    type: 'scatter'
  };
  var trace2 = {
    x: smoothingLocalStg.t,
    y: smoothingLocalStg.smoothedTri,
    type: 'scatter'
  };
  var trace3 = {
    x: smoothingLocalStg.t,
    y: smoothingLocalStg.smoothedGauss,
    type: 'scatter'
  };

  console.log(trace0.t);
  var data = [trace0, trace1, trace2, trace3];

  var layout = {
    yaxis: {rangemode: 'tozero',
      showline: true,
      zeroline: true}
  };

  Plotly.newPlot('plot', data, layout)

}
