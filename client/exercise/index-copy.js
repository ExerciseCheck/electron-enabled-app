var Kinect2 = require('../lib/kinect2'),
	express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
	XLSX = require('xlsx');
const fs = require('fs');

var kinect = new Kinect2();
var clients = 0;
if(kinect.open()) {
	// Server Initiation
	server.listen(8000);
	console.log('Server listening on port 8000');
	console.log('Point your browser to http://localhost:8000');
	app.use(express.static('public'))

	// Initiation State
	var systemState = 3, // 3 is the initiation code || 1: recording, 2: display, 0: live, 3: init == live
			bufferTrial= [];
	var gtArray = [];
	var exArray = [];
	var bufferBodyFrames =[];
	var id = 0; //identification number for the current recording
	var startTime, duration;

	console.log('system init state');
	kinect.openBodyReader();

	// Connection On:
	io.on('connection', function(socket){
		++clients;
		console.log('a user connected');
		// systemState could be 0..3 during connection event, but only 2 needs signal emission
		if (systemState == 2) {
			socket.emit('disp',bufferBodyFrames,systemState);
		}

		// transition between states
		socket.on('command',function(){
			systemState = StateTrans(systemState);
			switch (systemState) { // During the transition, prepare the buffer
				case 1: // 0->1 or 3->1 Get ready for recording
					bufferBodyFrames = []; // No Other Specific Actions in this block because it is done by kinect.on()
					console.log('System in Recording state');
					startTime = new Date().getTime();
				break;

				case 2: // 1->2, Push the BodyFrames Data to the current trial
					duration = ((new Date().getTime() - startTime)/1000).toFixed(2);
					kinect.closeBodyReader(); // if closeBodyReader is called twice, the server is down.
					bufferBodyFrames.duration = duration.toString()+ " seconds";
					bufferTrial.push(bufferBodyFrames);
					console.log('system in Result Display state'); // Action
					socket.emit('disp',bufferBodyFrames,systemState);
					socket.broadcast.emit('disp',typeofTest(bufferBodyFrames),bufferBodyFrames,systemState);
				break;

				case 0: // 2->0, get the system from Result Disp to Live state.
					kinect.openBodyReader();// No Other Specific Actions in this block because it is done by kinect.on()
					console.log('system in Live state');
				default:
			}
		});

		socket.on('choose',function(num){
			testID = bufferTrial.length-1;
			if (gtArray[gtArray.length-1] == testID) { gtArray.pop(); }
			if (exArray[exArray.length-1] == testID) { exArray.pop(); }
						if (num == 1) { gtArray.push(testID); }
			else{	if (num == 2) { exArray.push(testID); } }
		})

		socket.on('analyze',function(){
	    console.log('analyze signal received!');

			var chartData = chartAnalyze(bufferTrial,gtArray,exArray);
			var curveData = curveAnalyze(bufferTrial,gtArray,exArray);
			var barData = barAnalyze(bufferTrial,gtArray.exArray);
			// console.log('curveRequest received!');
	    socket.emit('report',chartData, curveData, barData, gtArray, exArray);
	    //save2xlsx(bufferTrial,'output.xlsx');
    });

		socket.on('curveRequest',function(num){
			//empty
			//socket.emit('curvePlot',curveData);
		});


		kinect.on('bodyFrame', function(bodyFrame){
			switch (systemState) {
				case 1: //recording: save the data being recorded, give identification to client
					socket.emit('rec', bodyFrame, systemState);
					socket.broadcast.emit('rec', bodyFrame, systemState);
					bufferBodyFrames.push(bodyFrame); // save the bodyFrame by pushing it to buffer
					break;

				case 2: //display
					console.log('system in display state, but system is streaming. Something wrong here.');
					break;

				case 0: //live
					socket.emit('live', bodyFrame,systemState)
					socket.broadcast.emit('live', bodyFrame,systemState);
					break;

				case 3: //3 init
					socket.emit('init', bodyFrame, systemState);
					socket.broadcast.emit('init', bodyFrame, systemState);
					break;

				default:
					console.log('System State unknown');
			}//end of switch
		}); // end of kinect.on('bodyframe',function)

		// disconnect
		socket.on('disconnect',function(){
			console.log('a user disconnect');
			--clients;
		})
	}); // end of io.on('connection',function)
}//end of kinect.open()


// Functions

// Define the legal move between states
function StateTrans(st){
	return (st+1)%3;
}

function locateBodyTrackedIndex(bufferBodyFrames){
	var ind = -1;
	for (var i=0; i<=5; i++){
		if (bufferBodyFrames[0].bodies[i].tracked){ // tracked in the first frame
			ind = i;
			break;
		}
	return ind;
	}
}

function typeofTest(bufferBodyFrames){
	var type // 0: Hand, 1: Squat
	var typeList = ["Hand","Squat"]
	var ind = locateBodyTrackedIndex(bufferBodyFrames);
	var max_spine_midY = -10000000, min_spine_midY = 10000000;
	// using the index to locate the bufferBodyFrames[i].body[ind].joint[0]
	// find the max and min of bufferBodyFrames[i].body[ind].joint[0].DepthY;
	if (ind>=0){
		for (var i = 0; i<=bufferBodyFrames.length-1; i++){
			if (bufferBodyFrames[i].bodies[ind].joints[1].depthY>max_spine_midY){
				max_spine_midY = bufferBodyFrames[i].bodies[ind].joints[1].depthY;
			}
			if (bufferBodyFrames[i].bodies[ind].joints[1].depthY<min_spine_midY){
				min_spine_midY = bufferBodyFrames[i].bodies[ind].joints[1].depthY;
			}
		}
	} // end of if(ind>=0)

	if (max_spine_midY-min_spine_midY > 0.12 && max_spine_midY-min_spine_midY < 1000)
		type = typeList[1];
	else {
		type = typeList[0];
		}
	return type;
}

function save2xlsx(bufferTrial,filename){
	var ws_name = "SheetJS";
	var wb = new Workbook(), ws = sheet_from_buffer(bufferTrial[0]);
	wb.SheetNames.push(ws_name);
	wb.Sheets[ws_name] = ws;
	var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
	XLSX.writeFile(wb, filename);
}
function Workbook() {
    if(!(this instanceof Workbook)) return new Workbook();
    this.SheetNames = [];
    this.Sheets = {};
}
function sheet_from_buffer(bufferBodyFrames, opts) {
    var ws = {};
    var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
		range.s.r = 0;
		range.s.c = 0;
		range.e.r = 0;
		range.e.c = 175;
		R = 0;
    for(var C = 0; C<176; ++C) {
        var cell = {v: "title" };

        if(cell.v == null) continue;
        var cell_ref = XLSX.utils.encode_cell({c:C,r:R});
        if(typeof cell.v === 'number') cell.t = 'n';
        else if(typeof cell.v === 'boolean') cell.t = 'b';
        else cell.t = 's';
        ws[cell_ref] = cell;
    }
    if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
    return ws;
}

function chartAnalyze(bufferTrial,gtArray,exArray){
  var gtLabel = [], exLabel = [];
  for (var i in gtArray){
    gtLabel.push("GT_"+(i).toString());
  }
  for (var i in exArray){
    exLabel.push("EX_"+(i).toString());
  }

  var chartData = [
    {    "Name": "Duration",    },
    {    "Name": "Type",				},
  ];
  // Duration
  for (var i in gtArray){
    chartData[0][ gtLabel[i] ] = bufferTrial[gtArray[i]].duration;
		chartData[1][ gtLabel[i] ] = typeofTest( bufferTrial[gtArray[i]] );
  }
  for (var i in exArray){
    chartData[0][ exLabel[i] ] = bufferTrial[exArray[i]].duration;
		chartData[1][ gtLabel[i] ] = typeofTest( bufferTrial[gtArray[i]] );
  }
  return chartData;
}

function curveAnalyze(bufferTrial, gtArray, exArray){
	var curveData ={
		"numDataSets": 2,
		"labels": ["1", "", "", "", "", "6", "", "", "", "", "11"],
		"dataset1": [-100, -10,-10, -10, -10, -10, 10, 10, 10,100,1000],
		"dataset2": [100, 10,10, 10, 10, 10, -10]
	};
	return curveData;
}

function barAnalyze(bufferTrial, gtArray, exArray){
	var barData;
	return barData;
}
/* Reference
Look-up for joint selection
Kinect2.JointType = {
 spineBase       : 0,
 spineMid        : 1,
 neck            : 2,
 head            : 3,
 shoulderLeft    : 4,
 elbowLeft       : 5,
 wristLeft       : 6,
 handLeft        : 7,
 shoulderRight   : 8,
 elbowRight      : 9,
 wristRight      : 10,
 handRight       : 11,
 hipLeft         : 12,
 kneeLeft        : 13,
 ankleLeft       : 14,
 footLeft        : 15,
 hipRight        : 16,
 kneeRight       : 17,
 ankleRight      : 18,
 footRight       : 19,
 spineShoulder   : 20,
 handTipLeft     : 21,
 thumbLeft       : 22,
 handTipRight    : 23,
 thumbRight      : 24
};
*/
