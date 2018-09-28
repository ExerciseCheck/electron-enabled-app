'use strict';

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
