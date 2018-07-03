'use strict';

var refFrames, recentFrames;

function parseURL(url) {

  var exerciseId = null;
  var patientId = null;
  var mode = null;
  var type = null;
  const urlToArray = url.split('/');

  mode = urlToArray[3];
  type = urlToArray[4];
  //logged-in user is a clinician
  if (urlToArray.length === 7) {
    exerciseId = urlToArray[5];
    patientId = urlToArray[6];
  }
  //logged-in user is a patient
  else if (urlToArray.length === 6) {
    exerciseId = urlToArray.pop();
    patientId = null;
  }
  return {
    mode: mode,
    patientId: patientId,
    exerciseId: exerciseId,
    type: type
  };
}

function action(nextMode, type) {

  const parsedURL = parseURL(window.location.pathname);
  var patientId = parsedURL.patientId;
  var exerciseId = parsedURL.exerciseId;
  function redirect() {
    var redirectToUrl = '/userexercise/session/' + nextMode + '/' + type + '/' + exerciseId + '/';
    window.location = (!parsedURL.patientId) ? redirectToUrl : redirectToUrl + patientId;
  }
  if(nextMode === 'stop') {
    localStorage.setItem('canStartRecording', false);
    redirect();
  }
  else if(nextMode === 'start') {
    localStorage.removeItem('data');
    redirect();
  }
  else {
    redirect();
  }
}

function saveReference() {

  const pathToArray = window.location.pathname.split('/');
  const exerciseId = pathToArray[5];
  const patientId = pathToArray[6];
  const redirectToUrl = '/userexercise/setting/' + exerciseId +'/' + patientId;
  let values = {};
  let data = JSON.parse(localStorage.getItem('data'));
  values.bodyFrames = JSON.stringify(data);
  $.ajax({
    type: 'PUT',
    url: '/api/userexercise/reference/mostrecent/data/' + exerciseId + '/' + patientId,
    data: values,
    success: function (result) {
      localStorage.clear();
      window.location = redirectToUrl
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function savePractice() {

  const parsedURL = parseURL(window.location.pathname);
  let url ='/api/userexercise/practice';
  let patientId = '';
  let values = {};
  let data = JSON.parse(localStorage.getItem('data'));
  values.exerciseId = parsedURL.exerciseId;
  values.bodyFrames = JSON.stringify(data);
  //logged-in user ia clinician
  if (parsedURL.patientId) {
    url = '/api/userexercise/practice/' + parsedURL.patientId;
    patientId = parsedURL.patientId;
  }
  $.ajax({
    type: 'POST',
    url: url,
    data: values,
    success: function (result) {
       localStorage.clear();
       window.location = '/userexercise/session/start/practice/' +
                     parsedURL.exerciseId + '/' + patientId;
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function goTodashBoard() {
  localStorage.clear();
  window.location = '/dashboard';
}

function goToExercises() {

  const patientId = window.location .pathname.split('/').pop();
  window.location = '/clinician/patientexercises/' + patientId;
}

(function ()
{
  let processing, canvas, ctx, ref_canvas, ref_ctx;
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
  //canvas dimension
  let width = 0;
  let height = 0;
  let radius=9; //radius of joint circle
  let circle_radius = 50//radius of calibration circle
  let jointType = [7,6,5,4,2,8,9,10,11,10,9,8,2,3,2,1,0,12,13,14,15,14,13,12,0,16,17,18,19];//re visit and draw in a line
  // index of reference frame
  let ref_counter = 0;
  // number of live frame captured from kinect
  let live_counter = 0;
  let inPosition = false;
  let parsedURL = parseURL(window.location.pathname);

  showCanvas();
  if (isElectron()) {
    document.addEventListener('DOMContentLoaded', function() {
      processing = false;
      canvas = document.getElementById('outputCanvas');
      ctx = canvas.getContext('2d');
      ref_canvas = document.getElementById('refCanvas');
      ref_ctx = ref_canvas.getContext('2d');
      //get the canvas dimension
      width = canvas.width;
      height = canvas.height;
      window.Bridge.eStartKinect();

      //checks what type of "mode" page is currently on && if reference exists
      if(localStorage.getItem("refFrames") === null) {
        //This only happens if we are creating a new frame, since we only grab refFrames and put into localstorage
        //when we are doing an updatereference or a practice session
        // alert("No reference frames in localStorage");
      } else {
        // alert("Reference frames exist");
        refFrames = JSON.parse(localStorage.getItem('refFrames'));
        recentFrames = JSON.parse(localStorage.getItem('data'));
      }

    });
  }

  // the function that controls the canvas hiding/displaying logic
  function showCanvas() {
    if(parsedURL.mode === 'start') {
      document.getElementById("refCanvas").style.display = "block";
    }
    else if(parsedURL.mode === 'play' && parsedURL.type === 'reference') {
      document.getElementById("outputCanvas").style.display = "block";
    }
    else {
      document.getElementById("refCanvas").style.display = "inline";
      document.getElementById("outputCanvas").style.display = "inline";

    }
  }

  //function that draws the body skeleton
  function drawBody(parameters, ctx, drawCircle = true){
    let body = parameters;
    jointType.forEach(function(jointType){
      drawJoints({cx: body.joints[jointType].depthX * width, cy: body.joints[jointType].depthY * height},ctx);
    });
    if(drawCircle)
    {
      drawCenterCircle({
        x: width / 2, y: height / 5, r: circle_radius, nx: body.joints[2].depthX * width, ny: body.joints[2].depthY * height
      },ctx);
    }
    //connect all the joints with the order defined in jointType
    ctx.beginPath();
    ctx.moveTo(body.joints[7].depthX * width, body.joints[7].depthY * height);
    jointType.forEach(function(jointType){
      ctx.lineTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
      ctx.moveTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
    });
    ctx.lineWidth=8;
    ctx.strokeStyle='blue';
    ctx.stroke();
    ctx.closePath();
  }

  //function that draws each joint as a yellow round dot
  function drawJoints(parameters, ctx){
    let cx = parameters.cx;
    let cy = parameters.cy;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI*2); //radius is a global variable defined at the beginning
    ctx.closePath();
    ctx.fillStyle = "yellow";
    ctx.fill();
  }

  // Draw the red Center Circle in ctx1 (canvasSKLT)
  function drawCenterCircle(parameters, ctx){
    //coordinate of the red circle
    let x = parameters.x;
    let y = parameters.y;
    //radius
    let r = parameters.r;
    //
    let head_x = parameters.nx;
    let head_y = parameters.ny;
    ctx.beginPath();
    //euclidean distance from head to calibration circle
    let dist = Math.sqrt(Math.pow((head_x - x),2) + Math.pow((head_y - y), 2));
    if(dist <= r){
      //When person's neck enters green circle && mode is 'play', recording will start.
      ctx.strokeStyle="green";
      var parsedURL = parseURL(window.location.pathname);
      if(parsedURL.mode === 'play') {
        localStorage.setItem('canStartRecording', true);
      }
    }
    else
      ctx.strokeStyle="red";

    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle="black";
  }

  //only start drawing with a body frame is detected
  window.Bridge.aOnBodyFrame = (bodyFrame) =>
  {
    const parsedURL = parseURL(window.location.pathname);
    //clear out the canvas so that the previous frame will not overlap
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ref_ctx.clearRect(0, 0, canvas.width, canvas.height);
    //tag the canvas
    ctx.font="30px Comic Sans MS";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("Live", canvas.width/2, canvas.height/20);
    ref_ctx.font="30px Comic Sans MS";
    ref_ctx.fillStyle = "red";
    ref_ctx.textAlign = "center";
    ref_ctx.fillText("Reference", canvas.width/2, canvas.height/20);

    let data = JSON.parse(localStorage.getItem('data')) || [];

    //draw each joint circles
    bodyFrame.bodies.forEach(function (body)
    {
      if (body.tracked)
      {
        //draw the body skeleton in live canvas
        drawBody(body,ctx,);
        //increment the live counter
        live_counter = live_counter + 1;
        //location of the neck
        let neck_x = body.joints[2].depthX;
        let neck_y = body.joints[2].depthY;

        // check inposition status whenever kinect captures a body
        if((Math.sqrt(Math.pow(((neck_x - 0.5)* width),2) + Math.pow(((neck_y - 0.2)*height), 2))) <= circle_radius === true) {
          inPosition = true;
        }
        if(JSON.parse(localStorage.getItem('canStartRecording')) === true)
        {
          data.push(body);
          localStorage.setItem('data', JSON.stringify(data));
        }
      }
      //if the patient is in position and doing a practice session
      if(inPosition && (parsedURL.type === 'practice'))
      {
          //draw in the reference canvas
          drawBody(refFrames[ref_counter], ref_ctx, false);
          //display one frame of reference every 2 frames of live frame captured
          //we can manipulate the number to control the display speed
          if (live_counter >= 1)
          {
            ref_counter = (ref_counter + 2) % refFrames.length;
            live_counter = 0;
            console.log("run!");
          }
          console.log(live_counter);
      }
    });
  };

  function isElectron() {
    return 'Bridge' in window;
  }
})();
