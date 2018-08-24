'use strict';

function getExerciseId() {

  return (window.location.pathname.split('/'))[3];
}

function getPatientId() {

  return (window.location.pathname.split('/'))[4];
}


//for smoothing test
function plotData() {
  let smoothingResult = {};

  $.get('/api/userexercise/smoothingtest/' + getExerciseId() + '/' + getPatientId(), function(data){
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

  Plotly.newPlot('plot', data, layout);

}
