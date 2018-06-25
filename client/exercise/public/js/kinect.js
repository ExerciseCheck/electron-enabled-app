var socket = io.connect('/');
var clientActive = false;

$(document).ready(function () {
  var canvasSKLT = document.getElementById('bodyCanvas');
  var ctx1 = canvasSKLT.getContext('2d');

  document.getElementById("display").style.display = 'none';
  var colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];

  // Globals:
  var radius=9;
  var width = canvasSKLT.width;
  var height = canvasSKLT.height;

  var IntervalID;

  // Signals

  // Use bodyFrame from server to update the canvas 1 on client
  socket.on('init', function(bodyFrame,systemState){
    clientActive = true;
    liveupdateCanvas1(bodyFrame,-1);
    document.getElementById("command").value= 'Start';
    document.getElementById("command").style.backgroundColor = '';
    document.getElementById("display").style.display = 'none';
  });

  socket.on('rec', function(bodyFrame,systemState, tracingID){
    clientActive = true;
    liveupdateCanvas1(bodyFrame,tracingID);
    document.getElementById("command").value = 'Stop';
    document.getElementById("command").style.backgroundColor = 'red';
    document.getElementById("display").style.display = 'none';
  });

  socket.on('disp', function(bufferBodyFrames,systemState, tracingID, activityLabeled){
    clientActive = true; // unlock the button
    IntervalID = animateCanvas1(bufferBodyFrames,tracingID);
    document.getElementById("command").value = 'Live';
    document.getElementById("command").style.backgroundColor = '';
    if (!activityLabeled)
      document.getElementById("display").style.display = 'block';
  });

  socket.on('live', function(bodyFrame,systemState, tracingID){
    clientActive = true;
    clearInterval(IntervalID);
    liveupdateCanvas1(bodyFrame,-1);

    document.getElementById("command").value= 'Start';
    document.getElementById("command").style.backgroundColor = '';
    document.getElementById("display").style.display = 'none';
  });

  socket.on('serverDataLabeled',function(){ // hid the buttons "Reference","Exercise","Discard"
    document.getElementById("display").style.display = 'none';
  });

  // Functions

  function drawCircle(x, y, r, color){ // Not used in current code
    ctx1.beginPath();
    ctx1.strokeStyle=color;
    ctx1.arc(x, y,r,0,Math.PI*2);
    ctx1.stroke();
  }

  function drawBody(body){
    //drawCircle(50, 50, 10, "green");
    // console.log("Works~!");
    jointType = [7,6,5,4,2,8,9,10,11,10,9,8,2,3,2,1,0,12,13,14,15,14,13,12,0,16,17,18,19] //re visit and draw in a line
    jointType.forEach(function(jointType){
      drawJoints(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
    });
    drawCenterCircle(width/2, height/5, 50, body.joints[2].depthX * width, body.joints[2].depthY * height);

    ctx1.beginPath();
    ctx1.moveTo(body.joints[7].depthX * width, body.joints[7].depthY * height);
    jointType.forEach(function(jointType){
      ctx1.lineTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
      ctx1.moveTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
    });
    ctx1.lineWidth=10;
    ctx1.strokeStyle='blue';
    ctx1.stroke();
    ctx1.closePath();
  }

  function drawJoints(cx,cy){
      ctx1.beginPath();
      ctx1.arc(cx,cy,radius,0,Math.PI*2); //radius is a global variable defined at the beginning
      ctx1.closePath();
      ctx1.fillStyle = "yellow";
      ctx1.fill();
  }

  function drawFloor(floor, body){
      tilt = Math.atan( floor.z / floor.y) * (180.0 / Math.PI);
      // console.log(body.joints[11]);
      jointType = [3, 8, 9, 10, 11, 16, 17, 18, 19]
      jointType.forEach(function(jointType){
        distanceFromFloor(floor, body.joints[jointType]);
      });
      // dist = distanceFromFloor(floor, body.joints[11]);
      // console.log("Kinect-floor dist (0 => view is obstructed)", floor.w, "| tilt is ", tilt, "| dist of right hand from the floor ", dist);

  }

  function distanceFromFloor(floor, joint){
    numerator = floor.x * joint.cameraX + floor.y * joint.cameraY + floor.z * joint.cameraZ + floor.w;
    denominator = Math.sqrt(floor.x * floor.x + floor.y * floor.y + floor.z * floor.z);
    dist = numerator / denominator;
    console.log(floor.x * width,floor.y * height, joint.depthX * width,joint.depthY * height);
    ctx1.beginPath();
    // ctx1.moveTo( (floor.x + joint.depthX) * width, floor.y * height);
    // ctx1.lineTo(joint.depthX * width, joint.depthY * height);
    // ctx1.stroke();

    ctx1.font = "14px Arial";
    ctx1.fillText(dist.toFixed(2) + 'm', joint.depthX * width + 30, joint.depthY * height);

    ctx1.closePath();
    return dist;
  }

  // Draw Center Circle in ctx1 (canvasSKLT)
  function drawCenterCircle(x, y, r, nx, ny){
    ctx1.beginPath();
    if(nx > x-r && nx < x+r && ny > y-r && ny < y+r)
      ctx1.strokeStyle="green";
    else
      ctx1.strokeStyle="red";

    ctx1.arc(x, y,r,0,Math.PI*2);
    ctx1.stroke();
    ctx1.closePath();
    ctx1.strokeStyle="black";
  }


  function liveupdateCanvas1(bodyFrame, tracingID){
    ctx1.clearRect(0, 0, width, height);
    //drawCircle(ctx1, 50, 50, 10, "red"); removed if following code line works
    //drawCenterCircle(width/2, height/5, 50, body.joints[2].depthX * width, body.joints[2].depthY * height);
    if (tracingID == -1){
      bodyFrame.bodies.some(function(body){
        if(body.tracked){ drawBody(body); drawFloor(bodyFrame.floorClipPlane,  body); return(body.tracked);}
      });

        // drawFloor(bodyFrame);
    }
    else {
      drawBody(bodyFrame.bodies[tracingID]);
    }
  }

  function animateCanvas1(bufferBodyFrames,tracingID){
    var i = 0;
    var TimerID = setInterval(function(){
      liveupdateCanvas1(bufferBodyFrames[i], tracingID);
      i++;
      if (i>=bufferBodyFrames.length){i=0;}
    },20);
    return TimerID;
  }
});



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
