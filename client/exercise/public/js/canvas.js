/*var chartColors = [
  'rgb(54, 162, 235)', //blue
  'rgb(54, 162, 235)', //blue
  'rgb(54, 162, 235)', //blue
  'rgb(54, 162, 235)', //blue
  'rgb(54, 162, 235)', //blue
  'rgb(54, 162, 235)', //blue
  'rgb(255, 99, 132)', //red
  'rgb(255, 99, 132)', //red
  'rgb(255, 99, 132)', //red
  'rgb(255, 99, 132)', //red
  'rgb(255, 99, 132)', //red
  'rgb(255, 99, 132)', //red
  'rgb(255, 99, 132)', //red
];
*/
var chartColors = [
  'rgb(255, 99, 132)', //red
  'rgb(54, 162, 235)', //blue:
  'rgb(255, 159, 64)', //orange:
  'rgb(255, 205, 86)', //yellow
  'rgb(75, 192, 192)', //green
  'rgb(153, 102, 255)', //purple:
  'rgb(231,233,237)', //grey:
  'rgb(255, 99, 132)', //red
  'rgb(54, 162, 235)', //blue:
  'rgb(255, 159, 64)', //orange:
  'rgb(255, 205, 86)', //yellow
  'rgb(75, 192, 192)', //green
  'rgb(153, 102, 255)', //purple:
  'rgb(231,233,237)', //grey:
  'rgb(255, 99, 132)', //red
  'rgb(54, 162, 235)', //blue:
  'rgb(255, 159, 64)', //orange:
  'rgb(255, 205, 86)', //yellow
  'rgb(75, 192, 192)', //green
  'rgb(153, 102, 255)', //purple:
  'rgb(231,233,237)' //grey:
];

function barTemplateA(barData,gtArray,exArray){

    var Labels = [
      "Left Hand Speed Ratio",
      "Left Hand Height Change",
      "Right Hand Speed Ratio",
      "Right Hand Height Change",
      "Pelvic Speed Ratio",
      "Pelvic Height Change",
      "Trunk Orientation",
      "Hip A-P Movement"
    ];
    var color = Chart.helpers.color;

  var horizontalBarChartData = {} ;
  horizontalBarChartData.labels = Labels;
  horizontalBarChartData.datasets= [];
  for (var i = 0; i < exArray.length; i++){
    var obj = {};
    obj.label = "Exercise_" + i.toString();
    obj.backgroundColor = color(chartColors[i]).alpha(0.5).rgbString(),
    obj.borderColor = chartColors[i];
    obj.borderWidth = 1;
    obj.data = [
      barData.leftHandSpeed[i],
      barData.leftHandHeightChange[i],
      barData.rightHandSpeed[i],
      barData.rightHandHeightChange[i],
      barData.pelvicSpeed[i],
      barData.pelvicHeightChange[i],
      barData.SpineMidOrientation [i],
      barData.SpineBaseMovement[i],
    ];
    horizontalBarChartData.datasets.push(obj);
  }

  var config = {
      type: 'horizontalBar',
      data: horizontalBarChartData,
      options: {
          // Elements options apply to all of the options unless overridden in a dataset
          // In this case, we are setting the border of each horizontal bar to be 2px wide
          elements: {
              rectangle: {
                  borderWidth: 2,
              }
          },
          responsive: true,
          legend: {
              position: 'right',
              labels: {
                fontSize: 24
              }
          },

          title: {
              display: true,
              text: 'Horizontal Bar Chart',
              fontSize: 28

          },
          scales: {
            yAxes: [{
                ticks: {
                    // Include a dollar sign in the ticks
                    fontSize: 24
                    }

            }],
            xAxes: [{
              ticks: {
                fontSize: 24
              }
            }]
        }
      }

  }

  return config;
}

function lineTemplateA(curveData){

  var config_template = {
      type: 'line',
      data: {
          //labels:[],
          datasets: []
      },
      options: {
          tooltips: {
            enabled: false
          },
          responsive: true,
          title:{
              display:true,
              text:'Line Chart',
              fontSize: 28
          },
          scales: {
              xAxes: [{
                  display: true,
                  scaleLabel: {
                      display: true,
                      labelString: 'Time (secs)',
                      fontSize: 24,
                  },
              ticks:{
                autoSkip: false,
                fontSize: 24,
              }

              }],
              yAxes: [{
                  display: true,
                  scaleLabel: {
                      display: true,
                      labelString: 'Measurements (m or degrees)',
                      fontSize: 24
                  },
                  ticks:{
                    fontSize: 24
                  }

              }]
          },
          legend: {
              position: 'right',
              labels: {
                fontSize: 24
              }
          }
      }
  };

  var config = config_template;

  for (var i = 0; i < curveData.numDataSets; i++){
    var obj = {};
    obj.label = curveData.labels[i];
    obj.backgroundColor = chartColors[i],
    obj.borderColor = chartColors[i];
    obj.fill = false;
    obj.data = curveData.dataset[i];

    config.data.datasets.push(obj);
  }
  config.data.labels = curveData.xticks;

  return config;
}

function createCheckbox(option,s,chboxID){
  var pair = option
  var checkbox = document.createElement("input");
  checkbox.id = chboxID;
  checkbox.type = "checkbox";
  checkbox.name = pair;
  checkbox.value = pair;
  s.appendChild(checkbox);

  var label = document.createElement('label')
  label.htmlFor = pair;
  label.appendChild(document.createTextNode(pair));
  s.appendChild(label);
}

function JSON2table(myBooks){
  var col = [];
  for (var i = 0; i < myBooks.length; i++) {
      for (var key in myBooks[i]) {
          if (col.indexOf(key) === -1)
              col.push(key);
      }
  }
  // CREATE DYNAMIC TABLE.
  var table = document.createElement("table");

  // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

  var tr = table.insertRow(-1);                   // TABLE ROW.
  for (var i = 0; i < col.length; i++) {
      var th = document.createElement("th");      // TABLE HEADER.
      th.innerHTML = col[i];
      tr.appendChild(th);
  }
  // ADD JSON DATA TO THE TABLE AS ROWS.
  for (var i = 0; i < myBooks.length; i++) {

      tr = table.insertRow(-1);

      for (var j = 0; j < col.length; j++) {
          var tabCell = tr.insertCell(-1);
          tabCell.innerHTML = myBooks[i][col[j]];
      }
  }
  // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
  var divContainer = document.getElementById("showData");
  divContainer.innerHTML = "";
  divContainer.appendChild(table);
}

function addCheckbox(gtArray, exArray, s){
  var optionArray1 = [], chboxID1 = [], optionArray2 = [], chboxID2 = [];
  for(var i in gtArray){
    optionArray1.push("Reference" + i.toString() + "(GT_" + i.toString()+")  ");
    chboxID1.push("ch"+i.toString()+"gt");
  }
  for(var i in exArray){
    optionArray1.push("Exercise" + i.toString() + "(EX_" + i.toString()+")  ");
    chboxID1.push("ch"+i.toString()+"ex");
  }
  for (var option in optionArray1){
    createCheckbox(optionArray1[option],s,chboxID1[option]);
  }
  s.appendChild(document.createElement("br"));
  for (var option in optionArray2){
    createCheckbox(optionArray2[option],s,chboxID2[option]);
  }
}

function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
} // end of window.onclick
