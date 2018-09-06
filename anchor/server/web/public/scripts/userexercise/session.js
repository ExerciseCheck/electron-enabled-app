'use strict';

// liveFrames is a temporary name/status for currently recorded frames.
// ref frames refers to either the updated ref (liveFrames -> refFrames) OR one from database
// recentFrames refers to practicee exercise 'stop' page (liveFrames -> recentFrames)
let liveFrames, refFrames, recentFrames, liveFrames_compressed, refFrames_compressed, recentFrames_compressed;
let MAX_BODYFRAMES_STORED = 4400;
let framesExceededLimit = false;
let req, db;
window.actionBtn = false;

window.onbeforeunload = (e) => {
  if (window.actionBtn) {
    return;
  }

  if(confirm('Are you sure you want to quit? Incomplete session data will be lost.')) {
    return;
  }
  else {
    return false;
  }
}

$('.actionBtn').click(function() {
  window.actionBtn = true;
})

function parseURL(url)
{

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

Ladda.bind('.ladda-button', {
      callback: function( instance ) {
        var progress = 0;
        var interval = setInterval( function() {
          var multiplier = Math.random() * 0.1;
          progress = Math.min( progress + multiplier, 1 );
          instance.setProgress( progress );

          if( progress === 1 ) {
            instance.stop();
            clearInterval( interval );
          }
        }, 200 );
      }
    });

function action(nextMode, type) {
  openDB(function() {
    const parsedURL = parseURL(window.location.pathname);
    var patientId = parsedURL.patientId;
    var exerciseId = parsedURL.exerciseId;

    function redirect() {
      var redirectToUrl = '/userexercise/session/' + nextMode + '/' + type + '/' + exerciseId + '/';
      window.location = (!parsedURL.patientId) ? redirectToUrl : redirectToUrl + patientId;
    }

    //This condition describes the end of an update or create reference.
    //The refFrames data in local storage gets set to the most recent frames.
    if(nextMode === 'stop' && type === 'reference') {
        console.log("liveFrames before compression=", (JSON.stringify(liveFrames).length*2) / 1048576, "MB");
        liveFrames_compressed = pako.deflate(JSON.stringify(liveFrames), { to: 'string' });
        console.log("liveFrames after compression=", (JSON.stringify(liveFrames_compressed).length*2) / 1048576, "MB");

        let updatedRef = {type: 'refFrames', body: liveFrames_compressed};
        let bodyFramesStore = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames');
        let request = bodyFramesStore.put(updatedRef);
        request.onsuccess = function(event) {
          redirect();
        }
    }
    else {
      if(nextMode === 'stop') {
        liveFrames_compressed = pako.deflate(JSON.stringify(liveFrames), { to: 'string' });
        let updatedLiveFrames = {type: 'liveFrames', body: liveFrames_compressed};
        let bodyFramesStore = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames');
        let request = bodyFramesStore.put(updatedLiveFrames);
      }
      redirect();
    }
  });
}

function saveReference() {

  const pathToArray = window.location.pathname.split('/');
  const exerciseId = pathToArray[5];
  const patientId = pathToArray[6];
  const redirectToUrl = '/userexercise/setting/' + exerciseId +'/' + patientId;
  let values = {};
  values.bodyFrames = refFrames_compressed;
  values.neckX = 2;
  values.neckY = 2;
  values.refMin = 2;
  values.refMax = 2;
  values.refLowerJoint = 2;
  values.refUpperJoint = 2;
  $.ajax({
    type: 'PUT',
    url: '/api/userexercise/reference/mostrecent/data/' + exerciseId + '/' + patientId,
    data: values,
    success: function (result) {
      window.location = redirectToUrl
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function savePractice() {

  const parsedURL = parseURL(window.location.pathname);
  let patientId = parsedURL.patientId;
  let exerciseId = parsedURL.exerciseId;
  let url ='/api/userexercise/practice/mostrecent/data/' + exerciseId + '/';
  let isComplete = false;
  let values = {};
  values.bodyFrames = recentFrames_compressed;

  if (patientId) {
    url = url + patientId;
  }
  if(setNumber === numSets) {
    values.weekEnd = new Date().getWeekNumber();
    isComplete = true;
  }
  $.ajax({
    type: 'PUT',
    url: url,
    data: values,
    success: function (result) {

        if(isComplete) {
        window.location = '/userexercise/session/end/practice/' +
          exerciseId + '/' + patientId;
        } else {
          window.location = '/userexercise/session/start/practice/' +
            exerciseId + '/' + patientId;
        }
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

window.onbeforeunload = (e) => {

  if (actionBtn) {
    return;
  }

  if(confirm('Are you sure you want to quit? Incomplete session data will be lost.')) {
    return;
  }
  else {
    // electron treats any return value that is not 'null' as intent to stay on the page
    return false;
  }
};

$('.actionBtn').click(function() {
  actionBtn = true;
});

(function ()
{

  let processing, canvas, ctx, ref_canvas, ref_ctx, exe_canvas, exe_ctx;
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
  //canvas dimension
  let width = 0;
  let height = 0;
  let radius=9; //radius of joint circle
  let circle_radius = 50//radius of calibration circle
  let jointType = [7,6,5,4,2,8,9,10,11,10,9,8,2,3,2,1,0,12,13,14,15,14,13,12,0,16,17,18,19];//re visit and draw in a line
  let notAligned = true; // whether person has aligned in circle for the first time or not
  let useTimer = true; // whether or not to use the startTimer() function
  // index of reference frame
  let ref_index = 0;
  // index of exercise frame
  let exe_index = 0;
  // number of live frame captured from kinect
  let live_counter = 0;

  let parsedURL = parseURL(window.location.pathname);

  if (isElectron())
  {
    document.addEventListener('DOMContentLoaded', function() {
      processing = false;
      //live canvas
      canvas = document.getElementById('outputCanvas');
      ctx = canvas.getContext('2d');
      //reference canvas
      ref_canvas = document.getElementById('refCanvas');
      ref_ctx = ref_canvas.getContext('2d');
      //exercise canvas
      exe_canvas = document.getElementById('exeCanvas');
      exe_ctx = exe_canvas.getContext('2d');
      //get the canvas dimension
      width = canvas.width;
      height = canvas.height;
      liveFrames = [];
      localStorage.setItem('canStartRecording', false);

      openDB(function() {
        let getref = db.transaction(['bodyFrames']).objectStore('bodyFrames').get('refFrames');
        getref.onsuccess = function(e) {
          if(getref.result.body) {
            try {
              refFrames_compressed = getref.result.body;
              refFrames = JSON.parse(pako.inflate(getref.result.body, { to: 'string' }));
            } catch (err) {
              console.log(err);
            }
            console.log("refFrames loaded locally");
          }
          showCanvas();
          console.log("show canvas called after getting referenceFrames");
        }

        let getrecent = db.transaction(['bodyFrames']).objectStore('bodyFrames').get('liveFrames');
        console.log("getrecent=", getrecent);
        getrecent.onsuccess = function(e) {
          if(getrecent.result.body) {
            try {
              recentFrames_compressed = getrecent.result.body;
              recentFrames = JSON.parse(pako.inflate(getrecent.result.body, { to: 'string' }));
            } catch (err) {
              console.log(err);
            }

          }
        }
      });
      window.Bridge.eStartKinect();
    });
  }

  // the function that controls the canvas hiding/displaying logic
  // we determine the state of the website by parsing URL
  // we also reset the reference counter whenever we transit to a new state
  function showCanvas()
  {

    //start of creating reference
    if(parsedURL.mode === 'start' && refFrames.length === 0)
    {
      ref_index = 0;
      exe_index = 0;
      //nothing should be shwon
      document.getElementById("refCanvas").style.display = "none";
      document.getElementById("exeCanvas").style.display = "none";
      document.getElementById("outputCanvas").style.display = "none";
    }
    // start of updating reference and practice
    else if((parsedURL.mode === 'start' || parsedURL.mode === 'end') && refFrames)
    {
      ref_index = 0;
      exe_index = 0;
      //show reference canvas only
      document.getElementById("refCanvas").style.display = "block";
      document.getElementById("exeCanvas").style.display = "none";
      document.getElementById("outputCanvas").style.display = "none";
    }
    //play state for updating reference and creating reference
    else if(parsedURL.mode === 'play' && parsedURL.type === 'reference')
    {
      ref_index = 0;
      exe_index = 0;
      //show live canvas only
      document.getElementById("refCanvas").style.display = "none";
      document.getElementById("exeCanvas").style.display = "none";
      document.getElementById("outputCanvas").style.display = "block";
    }
    //play state for practice
    else if(parsedURL.mode === 'play' && parsedURL.type === 'practice')
    {
      ref_index = 0;
      exe_index = 0;
      //show live canvas and reference canvas
      document.getElementById("refCanvas").style.display = "inline";
      document.getElementById("exeCanvas").style.display = "none";
      document.getElementById("outputCanvas").style.display = "inline";
    }
    //stop state for updating reference and creating reference
    else if(parsedURL.mode === 'stop' && parsedURL.type === 'reference')
    {
      ref_index = 0;
      exe_index = 0;
      //show reference canvas
      document.getElementById("refCanvas").style.display = "block";
      document.getElementById("exeCanvas").style.display = "none";
      document.getElementById("outputCanvas").style.display = "none";
    }
    //stop state for exercise
    else if(parsedURL.mode === 'stop' && parsedURL.type === 'practice')
    {
      ref_index = 0;
      exe_index = 0;
      //show reference and exercise canvas
      document.getElementById("refCanvas").style.display = "inline";
      document.getElementById("exeCanvas").style.display = "inline";
      document.getElementById("outputCanvas").style.display = "none";
    }
    //this case is used for error safety, should not be called normally
    else
    {
      ref_index = 0;
      exe_index = 0;
      console.log("State error occurs!");
    }
  }

  function startTimer() {
    let start = Date.now();
    let timer = setInterval(function () {
      let delta = Date.now() - start;
      let time = window.CONFIG.TIMER_MAX - Math.floor(delta / 1000);
      if (time <= 0) {
        clearInterval(timer);
        $("#timerStart").attr("class", "greenColor large");
        $("#timerStart").text("Now Recording...");
        $("#num").text("");
        localStorage.setItem('canStartRecording', true);
        notAligned = false;
        let event = new Event('timer-done');
        document.dispatchEvent(event);
      } else {
        $("#timerStart").text("Recording will begin in...");
        $("#num").text(time);
      }
    }, 100);
  }

  //function that draws the body skeleton
  function drawBody(parameters, ctx, drawCircle = true) {

    let body = parameters;
    jointType.forEach(function(jointType){
      drawJoints({cx: body.joints[jointType].depthX * width, cy: body.joints[jointType].depthY * height},ctx);
    });
    if(drawCircle)
    {
      drawCenterCircle({
        x: width / 2, y: 130, r: circle_radius, nx: body.joints[2].depthX * width, ny: body.joints[2].depthY * height
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
  function drawJoints(parameters, ctx) {

    let cx = parameters.cx;
    let cy = parameters.cy;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI*2); //radius is a global variable defined at the beginning
    ctx.closePath();
    ctx.fillStyle = "yellow";
    ctx.fill();
  }

  // Draw the red Center Circle in ctx1 (canvasSKLT)
  function drawCenterCircle(parameters, ctx) {

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
    if(notAligned) {
      if(dist <= r){
        //When person's neck enters green circle && mode is 'play', recording will start.
        ctx.strokeStyle="Lime";
        var parsedURL = parseURL(window.location.pathname);
        if(parsedURL.mode === 'play' && useTimer) {
          startTimer();
          useTimer = false;
        }
      }
      else {
        ctx.strokeStyle="red";
      }
    }
    else {
      ctx.strokeStyle="DimGray"; // circle turns into a dark grey color once countdown finishes
    }
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle="black";
  }

  //only start drawing with a body frame is detected
  //even though
  window.Bridge.aOnBodyFrame = (bodyFrame) =>
  {
    const parsedURL = parseURL(window.location.pathname);
    //clear out the canvas so that the previous frame will not overlap
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ref_ctx.clearRect(0, 0, ref_canvas.width, ref_canvas.height);
    exe_ctx.clearRect(0, 0, exe_canvas.width, exe_canvas.height);
    //tag the canvas
    ctx.font="30px MS";
    (notAligned) ? ctx.fillStyle = "red" : ctx.fillStyle = "#3de562";
    ctx.textAlign = "center";
    ctx.fillText("Live", canvas.width/2, canvas.height/20);

    ref_ctx.font="30px MS";
    ref_ctx.fillStyle = "red";
    ref_ctx.textAlign = "center";
    ref_ctx.fillText("Reference", canvas.width/2, canvas.height/20);

    exe_ctx.font="30px MS";
    exe_ctx.fillStyle = "red";
    exe_ctx.textAlign = "center";
    exe_ctx.fillText("Exercise", canvas.width/2, canvas.height/20);

    //draw each joint circles when a body is tracked
    bodyFrame.bodies.forEach(function (body)
    {
      if (body.tracked)
      {
        //draw the body skeleton in live canvas
        drawBody(body,ctx);
        //increment the live counter
        //location of the neck
        let neck_x = body.joints[2].depthX;
        let neck_y = body.joints[2].depthY;

        if(JSON.parse(localStorage.getItem('canStartRecording')) && !framesExceededLimit)
        {
          liveFrames.push(body);
          if(liveFrames.length >= MAX_BODYFRAMES_STORED)
          {
            framesExceededLimit = true;
            errorAlert("liveFrame data capacity of 4,400 bodyFrames has been reached.")
          }
        }
      }
      live_counter = live_counter + 1;
    });

    //if the patient is in position and doing a practice session

    if(JSON.parse(localStorage.getItem('canStartRecording')) === true && (parsedURL.type === 'practice') && (parsedURL.mode === 'play')) {

      //draw in the reference canvas
        drawBody(refFrames[ref_index], ref_ctx, false);
        //display one frame of reference every 2 frames of live frame captured
        //we can manipulate the number to control the display speed
        if (live_counter >= 3)
        {
          ref_index = (ref_index + 1) % refFrames.length;
          live_counter = 0;
        }
    }

    //check if it is in the state of displaying reference, if reference exists
    //1. end of creating reference and end of updating
    //2. start of updating
    //3. start of practice
    //4. end of practice
    //in theses cases, the in-position will not be checked
    else if (((parsedURL.type === 'reference') && (parsedURL.mode === 'stop')) ||
      ((parsedURL.type === 'reference') && (parsedURL.mode === 'start') && refFrames !== undefined) ||
      ((parsedURL.type === 'practice') && (parsedURL.mode === 'start' || parsedURL.mode === 'end')) ||
      ((parsedURL.type === 'practice') && (parsedURL.mode === 'stop'))
    )
    {
      //draw in the reference canvas
      drawBody(refFrames[ref_index], ref_ctx, false);
      //if in the end of practice state, we will also display the latest exercise, with the same frequency as the reference
      if((parsedURL.type === 'practice') && (parsedURL.mode === 'stop'))
      {
        drawBody(recentFrames[exe_index], exe_ctx, false);
      }
      //display one frame of reference every 2 frames of live frame captured
      //we can manipulate the number to control the display speed
      if (live_counter >= 3)
      {
        ref_index = (ref_index + 1) % refFrames.length;
        if(recentFrames)
        {
          exe_index = (exe_index + 1) % recentFrames.length;
        }
        live_counter = 0;
      }
    }
  };

  function isElectron() {

    return 'Bridge' in window;
  }
})();
