'use strict';

function parseURL(url) {

  var exerciseId = null;
  var patientId = null;
  const urlToArray = url.split('/');

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
    patientId: patientId,
    exerciseId: exerciseId
  };
}

function action(nextMode, type) {

  function setFlag(callback) {

    if(nextMode === 'play') {
      localStorage.setItem('canStartRecording', true);
    }
    else if(nextMode === 'stop') {
      localStorage.setItem('canStartRecording', false);
    } else {
      localStorage.clear();
    }
    callback();
  }

  setFlag(function(){

    const parsedURL = parseURL(window.location.pathname);
    var patientId = parsedURL.patientId;
    var exerciseId = parsedURL.exerciseId;
    var url = '/userexercise/session/' + nextMode + '/' + type + '/' + exerciseId + '/';
    window.location = (!parsedURL.patientId)? url: url + patientId;
  });
}

function saveReference() {

  const pathToArray = window.location.pathname.split('/');
  const exerciseId = pathToArray[5];
  const patientId = pathToArray[6];
  const redirectToUrl = '/userexercise/setting/' + exerciseId +'/' + patientId;
  const values = {};
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

  const values = {};
  const parsedURL = parseURL(window.location.pathname);
  values.exerciseId = parsedURL.exerciseId;
  let url ='/api/userexercise/practice';
  let patientId = '';
  //logged-in user is
  // clinician
  if (parsedURL.patientId) {
    url = '/api/userexercise/practice/' + parsedURL.patientId;
    patientId = parsedURL.patientId;
  }
  $.ajax({
    type: 'POST',
    url: url,
    data: values,
    success: function (result) {
       window.location = '/userexercise/session/start/practice/' +
                     parsedURL.exerciseId + '/' + patientId;
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function goTodashBoard() {

  window.location = '/dashboard';
}

function goToExercises() {

  const patientId = window.location .pathname.split('/').pop();
  window.location = '/clinician/patientexercises/' + patientId;
}

//@params:
// range_scale:
//      how much to scale the distance between spine and foot, TODO: spine==SpineBase==0? why?
// top_thresh, bottom_thresh:
//      the thresholds the patient should reach when the signal has been
//      scaled to a range between 0 and 1, for a repetition to count
function countReps(body, threshold_flag, range_scale=0.7, top_thresh=0.25, bottom_thresh=0.75) {

  //TODO: This should eventually be a db call

  const parsedURL = parseURL(window.location.pathname);
  var patientId = parsedURL.patientId;
  var exerciseId = parsedURL.exerciseId;
  var exInfo = getExerciseInfo(exerciseId);

  var reps = 0;
  var norm;

  var joint = exInfo['joint'];
  var coordinate = exInfo['axis'];

  // This is set when user is correctly positioned in circle
  if (coordinate == 'depthY') {
    norm = neck_y;
  } else if (coordinate == 'depthX') {
    norm = neck_x;
  }

  // Normalize reference points to neck
  var ref_norm = exInfo['ref_neck'];
  var ref_max = exInfo['ref_max'] - ref_norm;
  var ref_min = exInfo['ref_min'] - ref_norm;

  // Range is based on distance between foot and spine
  var ref_lower_joint = exInfo['ref_lower_joint'];
  var ref_upper_joint = exInfo['ref_upper_joint'];
  var range = (ref_lower_joint - ref_norm - ref_upper_joint) * range_scale;

  // Normalize current point by range and current neck value
  var current_pt = (body.joints[joint][coordinate] - norm - ref_max) / range;

  if ((threshold_flag == 'down') && (current_pt < top_thresh)) {
    reps++;
    return [reps, 'up'];
  } else if ((threshold_flag == 'up') && (current_pt > bottom_thresh)) {
    return [reps, 'down'];
  } else {
    return [reps, threshold_flag]
  }
}

var cntRep = 100;

//TODO: Shall be a db call
// Get info from JSON about a given exercise
// This info should be patient-specific
function getExerciseInfo(exerciseId){

}

(function ()
{
  let processing, canvas, ctx;
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
  //canvas dimension
  let width = 0;
  let height = 0;
  let radius=4; //radius of joint circle
  let circle_radius = 14//radius of calibration circle
  let jointType = [7,6,5,4,2,8,9,10,11,10,9,8,2,3,2,1,0,12,13,14,15,14,13,12,0,16,17,18,19];//re visit and draw in a line
  if (isElectron()) {
    document.addEventListener('DOMContentLoaded', function() {
      processing = false;
      canvas = document.getElementById('outputCanvas');
      ctx = canvas.getContext('2d');
      //get the canvas dimension
      width = canvas.width;
      height = canvas.height;
      window.Bridge.eStartKinect();
    });
  }

  //function that draws the body skeleton
  function drawBody(parameters, ctx){
    let body = parameters;
    jointType.forEach(function(jointType){
      drawJoints({cx: body.joints[jointType].depthX * width, cy: body.joints[jointType].depthY * height},ctx);
    });
    drawCenterCircle({
      x: width / 2, y: height / 5, r: circle_radius, nx: body.joints[2].depthX * width, ny: body.joints[2].depthY * height
    },ctx);

    //connect all the joints with the order defined in jointType
    ctx.beginPath();
    ctx.moveTo(body.joints[7].depthX * width, body.joints[7].depthY * height);
    jointType.forEach(function(jointType){
      ctx.lineTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
      ctx.moveTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
    });
    ctx.lineWidth=2;
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
    let neck_x = parameters.nx;
    let neck_y = parameters.ny;
    ctx.beginPath();
    //euclidean distance from neck to calibration circle
    let dist = Math.sqrt(Math.pow((neck_x - x),2) + Math.pow((neck_y - y), 2))
    if(dist <= r)
      ctx.strokeStyle="green";
    else
      ctx.strokeStyle="red";

    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle="black";
  }

  //only start drawing with a bodyframe is detected
  window.Bridge.aOnBodyFrame = (bodyFrame) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let frames = new Array();
    let data = JSON.parse(localStorage.getItem('data')) || [];

    //draw each joint circles
    bodyFrame.bodies.forEach(function (body) {
      if (body.tracked) {
        //draw the body skeleton
        drawBody(body,ctx);
        if(JSON.parse(localStorage.getItem('canStartRecording')) === true) {
          frames.push(body);
          data.push(frames);
          localStorage.setItem('data', JSON.stringify(data));
        }
      }
    });
  };

  function isElectron() {
    return 'Bridge' in window;
  }
})();
