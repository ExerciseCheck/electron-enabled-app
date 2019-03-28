function displayCharts(){
    console.log("Works~!");
}

function updateExercises(element){
    let uniqueUsersLocal = $(element).val().split(",");
    for(var i in uniqueUsersLocal){
        let el = '#' + uniqueUsersLocal[i];
        $(el).prop('disabled', true);    
    }
    
    var patient = $(element).text();
    var exList= [];
    if(buttonCounter === 0){
        for(var i=0; i<userSessions.length; i++){
            if(patient === userSessions[i].name){
                if (exList.indexOf(userSessions[i].ex) === -1)
                {
                    exList.push(userSessions[i].ex);
                    jQuery('<button/>', {
                        id: userSessions[i].ex.replace(/ /g,"_"),
                        text: userSessions[i].ex,
                        class: "btn btn-primary",
                        onclick: "updateChart(this)",
                        style: "margin: 5px",
                        value: patient
                    }).appendTo('#patients');
                } 
    
            }
    
        }
    }

    jQuery('<button/>', {
        id: "resetCharts",
        text: "Reset",
        class: "btn btn-danger",
        onclick: "resetCharts(this)",
        style: "margin: 5px",
        value: uniqueUsersLocal,
        data: exList
    }).appendTo('#patients');

    $('#patients span').text("Select exercise: ");
    buttonCounter = 1;
    chart.options.title.text = "Patient Selected: " + patient;
    chart.update();
}

function resetCharts(element){
    let users = $(element).val().split(",");
    let exercisesList = Object.values($(element).data());
    let exercisesString = exercisesList.join().replace(/ /g,"_").split(",");
    buttonCounter = 0;

    for(var i in users){
        let el = '#' + users[i];
        $(el).prop('disabled', false);    
    }

    for(var i in exercisesString){
        let el = '#' + exercisesString[i];
        $(el).remove();    
    }

    $(element).remove();
    $('#patients span').text("Select patient: ");

}
    
function updateChart(element){
    var patient = $(element).val();
    var exName = $(element).text();
    labelList = [];
    setListSpeed = [];
    console.log(userSessions)
    
    for(var i=0; i<userSessions.length; i++){
        if(patient === userSessions[i].name && exName === userSessions[i].ex){
            for(var j=0; j<userSessions[i].sets.length; j++){
                setListSpeed.push(userSessions[i].sets[j].analysis.speed);
                setListAccuracy.push(userSessions[i].sets[j].analysis.accuracy);
                console.log("setListSpeed:", setListSpeed, "labelList: ", labelList, "uesrSession: ", userSessions[i]);
            }
            labelList.push(userSessions[i].date);
            // console.log("setListSpeed:", setListSpeed, "labelList: ", labelList, "uesrSession: ", userSessions[i]);
        }

    }

    if(chart.datasets){
        for (i in chart.datasets)
        chart.removeData();
    }
    

    // for(var i=0; i<setListSpeed.length; i++){
    //     if(setListSpeed[i] != null){
    //         let value = setListSpeed[i].toString().split()
    //         // console.log('val:', setListSpeed[i].toString().split());
    //         chart.data.datasets[0].data = setListSpeed[i].toString().split();
    //         chart.data.datasets[i].label = "Speed";
    //     }
    // }

    // for(var i=0; i<setListSpeed.length; i++){
    //     chart.data.datasets[i].data[0] = setListSpeed[i].toString().split()
    // }

    chart.data.datasets[0].data = setListSpeed
    // chart.data.datasets[1].data = setListSpeed[1].toString().split()
    
    console.log("chart=", chart.data.datasets);
    
    chart.data.labels = labelList;
    
    chart.options.title.text = "Patient Name: " + patient + " | Exercise: " + $(element).text();
    chart.update();
}


//bar chart
// repTime is the threshold for color change from red to green.
var repTime = 0.5
var numSets = 1
var rep1 = [3,6,4]
var rep2 = [4,3,5]
var rep3 = [5,2,6]
var rep4 = [5,7,7]
var rep5 = [4,4,5]
var rep6 = [7,5,3]
var tableData = []
var userSessions = []
var uniqueUsers = []
var labelList = []
var setListSpeed = []
var setListAccuracy = []
var buttonCounter = 0
console.log("Hey you!");
$.ajax({
    type: 'GET',
    url: 'api/table/practiceExercise',
    success: function (result) {
        tableData = result;
    },
    async: false,
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
});

for(var i=0; i<tableData.data.length; i++){
        userSessions.push({date: tableData.data[i].createdAt.substring(0,10), name:tableData.data[i].name, ex: tableData.data[i].exerciseName, sets: tableData.data[i].sets});
        if (uniqueUsers.indexOf(tableData.data[i].name) === -1) uniqueUsers.push(tableData.data[i].name);
}

userSessions.sort((a, b) => (a.date < b.date) ? 1 : -1)

for(var i=0; i< uniqueUsers.length; i++){
    console.log("Creating label!");
    jQuery('<button/>', {
        id: uniqueUsers[i].replace(/ /g,"_"),
        text: uniqueUsers[i],
        class: "btn btn-primary",
        onclick: "updateExercises(this)",
        style: "margin: 5px",
        value: uniqueUsers
    }).appendTo('#patients');
}

var ctx = document.getElementById('bar-chart-container').getContext('2d');
//Function to draw a line at recommended speed for rep completion
Chart.pluginService.register({
afterDraw: function(chart) {
    if (typeof chart.config.options.lineAt != 'undefined') {
    var lineAt = chart.config.options.lineAt;
    var ctxPlugin = chart.chart.ctx;
    var xAxe = chart.scales[chart.config.options.scales.xAxes[0].id];
    var yAxe = chart.scales[chart.config.options.scales.yAxes[0].id];
    if(yAxe.min != 0) return;
    ctxPlugin.strokeStyle = "red";
    ctxPlugin.beginPath();
    lineAt = (lineAt - yAxe.min) * (100 / yAxe.max);
    lineAt = (100 - lineAt) / 100 * (yAxe.height) + yAxe.top;
    ctxPlugin.moveTo(xAxe.left, lineAt);
    ctxPlugin.lineTo(xAxe.right, lineAt);
    ctxPlugin.stroke();
    }
}
});

// var data = {
//             labels: labelList,
//             datasets: [
//                         {
//                             data: setListSpeed,
//                         },
//                     ],
// };

var data = {
    labels : [],
    datasets : [{
        data : []
    }]
  };

var colorPlugin = {

// We affect the `beforeUpdate` event
beforeUpdate: function(chart) {

    for(var x = 0; x < numSets; x++){
    var backgroundColor = [];
    var borderColor = [];
    var color;
    // For every data we have ...
    for (var i = 0; i < chart.config.data.datasets[x].data.length; i++) {

        // check time against recommended time
        if(chart.config.data.datasets[x].data[i] <= repTime*0.7){
        color = ('rgba(255, 99, 132, ');
        }
        else if (chart.config.data.datasets[x].data[i] == repTime){
        color = ('rgba(142, 213, 87, ');
        }
        else if (chart.config.data.datasets[x].data[i] > repTime){
        color = ('rgba(144, 178, 71, ');
        }

        // We push this new color to both background and border color arrays
        backgroundColor.push(color + '0.65)');
        borderColor.push(color +'1)');
    }

    // We update the chart bars color properties
    chart.config.data.datasets[x].backgroundColor = backgroundColor;
    chart.config.data.datasets[x].borderColor = borderColor;
    }
}
};

// We now register the plugin to the chart's plugin service to activate it
Chart.pluginService.register(colorPlugin);

Chart.plugins.register({
beforeDraw: function(chartInstance) {
    var ctx = chartInstance.chart.ctx;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
}
});

var chart = new Chart(ctx, {
type: 'bar',
data: data,
options: {
    title:{
        display: true,
        text: 'Session Reptition Accuracies',
        fontSize: 15,
        fontColor: 'black'
    },
    legend: {
        display: false
    },
    lineAt: repTime,
    scales: {
    xAxes: [{
        scaleLabel:{
        display: true,
        labelString: 'Sessions',
        fontColor: 'black',
        fontSize: 15
        },
    }],
    yAxes: [{
        scaleLabel:{
        display: true,
        labelString: 'Exercise Speed',
        fontColor: 'black',
        fontSize: 15
        },
        ticks: {
        beginAtZero:true
        },
        gridLines: {
        color: "black",
        borderDash: [2, 5]
        },
    }]
    }
}
});
