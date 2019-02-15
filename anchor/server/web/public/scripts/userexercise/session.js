'use strict';

// liveFrames is a temporary name/status for currently recorded frames.
// ref frames refers to either the updated ref (liveFrames -> refFrames) OR one from database
// recentFrames refers to practice exercise 'stop' page (liveFrames -> recentFrames)
let liveFrames = [], refFrames = [], recentFrames  = [], liveFrames_compressed  = [], refFrames_compressed  = [], recentFrames_compressed = [];
let req, db;
let dataForCntReps = {};
let liveBodyColor="#7BE39F";
let commonBlue = "#1E89FB";
let refJointColor = "#FF6786";
let MAX_BODYFRAMES_STORED = 4400;
let framesExceededLimit = false;
let threshold_flag, direction;

window.actionBtn = false;

window.onbeforeunload = (e) => {
  if (window.actionBtn) {
    return;
  }

  if (confirm('Are you sure you want to quit? Incomplete session data will be lost. Hahahah')) {
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

  let exerciseId = null;
  let patientId = null;
  let mode = null;
  let type = null;
  const urlToArray = url.split("/").reverse();
  //TODO We assume that logged in user is a clinician. The below logic will not work for a patient login since they have no patient id and url length will be different. We shall handle that case later, for now we asssume only clinicians or root logs in.
    exerciseId = urlToArray[1];
    patientId = urlToArray[0];
    mode = urlToArray[3];
    type = urlToArray[2];

  return {
    mode: mode,
    patientId: patientId,
    exerciseId: exerciseId,
    type: type
  };
}

Ladda.bind('.ladda-button', {
      callback: function( instance ) {
        let progress = 0;
        let interval = setInterval( function() {
          let multiplier = Math.random() * 0.1;
          progress = Math.min( progress + multiplier, 1 );
          instance.setProgress( progress );

          if( progress === 1 ) {
            instance.stop();
            clearInterval( interval );
          }
        }, 200 );
      }
    });

const parsedURL = parseURL(window.location.pathname);

let url = 'api/userexercise/dataforcount/' + parsedURL.exerciseId + '/';
url =(!parsedURL.patientId) ? url: url + parsedURL.patientId;
$.get(url, function(data){
  dataForCntReps = data;
  //group: (down, L2R) + and (up, R2L) -
  if(dataForCntReps.direction === 'L2R') {
    direction = "down";
    threshold_flag = "down";
  } else if (dataForCntReps.direction === 'R2L') {
    direction = "up";
    threshold_flag = "up";
  } else {
    direction = dataForCntReps.direction;
    threshold_flag = dataForCntReps.direction;
  }
  // redirect();
})

function action(nextMode, type) {
  openDB(function() {
    const parsedURL = parseURL(window.location.pathname);
    let patientId = parsedURL.patientId;
    let exerciseId = parsedURL.exerciseId;

    function redirect() {
      let redirectToUrl = 'userexercise/session/' + nextMode + '/' + type + '/' + exerciseId + '/';
      window.location = (!parsedURL.patientId) ? redirectToUrl : redirectToUrl + patientId;
    }

    // This condition describes the end of an update or create reference.
    // The refFrames data in local storage gets set to the most recent frames.
    if(nextMode === 'stop' && type === 'reference') {
        console.log("liveFrames before compression=", (JSON.stringify(liveFrames).length*2) / 1048576, "MB");
        liveFrames_compressed = pako.deflate(JSON.stringify(liveFrames), { to: 'string' });
        console.log("liveFrames after compression=", (JSON.stringify(liveFrames_compressed).length*2) / 1048576, "MB");

        let ref_ed = new Date().getTime();
        localStorage.setItem("refEnd", ref_ed);

        let updatedRef = {type: 'refFrames', body: liveFrames_compressed};
        let bodyFramesStore = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames');
        let request = bodyFramesStore.put(updatedRef);
        request.onsuccess = function(event) {
          redirect();
        }
    }

    //"Discard Reference Recording"
    else if(nextMode === 'start' && type === 'reference') {
      //hacky delete
      let deleteref = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames').put({type: 'refFrames', body: ''});
      deleteref.onsuccess = function(e) {
        redirect();
      }
    }

    //End of doing a practice session. Live Frames get saved temporarily to indexedDB
    else if(nextMode === 'stop' && type === 'practice') {
      liveFrames_compressed = pako.deflate(JSON.stringify(liveFrames), { to: 'string' });
      let request = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames').put({type: 'liveFrames', body: liveFrames_compressed});
      request.onsuccess = function(e) {
        redirect();
      }
    }
    //"Discard Practice Recording"
    else if(nextMode === 'start' && type === 'practice') {
      let deleterecent = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames').delete('liveFrames');
      deleterecent.onsuccess = function(e) {
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

// helper function for calculating the refMax, refMin
// axis is either 'depthX' or 'depthY'
function getMinMax_joint(joint, array, axis) {
  let out = [];
  array.forEach(function(el) {
    return out.push.apply(out, [el.joints[joint][axis]]);
  }, []);
  return { min: Math.min.apply(null, out), max: Math.max.apply(null, out) };
}

// assuming the save button is clicked by someone else
function saveReference() {
  const parsedURL = parseURL(window.location.pathname);
  let patientId = parsedURL.patientId;
  let exerciseId = parsedURL.exerciseId;
  parseURL(window.location.pathname);
  const redirectToUrl = 'userexercise/setting/' + exerciseId +'/' + patientId;

  let values = {};
  // save to referenceExercise
  values.bodyFrames = refFrames_compressed;
  let mm = getMinMax_joint(dataForCntReps.joint, refFrames, dataForCntReps.axis);
  values.refMin = mm.min;
  values.refMax = mm.max;
  values.neck2spineBase = refFrames[0].joints[0]["depthY"] - refFrames[0].joints[2]["depthY"];
  values.shoulder2shoulder = refFrames[0].joints[8]["depthX"] - refFrames[0].joints[4]["depthX"];
  let ed = localStorage.getItem("refEnd");
  let st = localStorage.getItem("refStart");
  localStorage.removeItem("refEnd");
  localStorage.removeItem("refStart");
  values.refTime = Math.round((ed - st) / 1000);
  console.log(values.refTime);
  // save also to dataForCntReps
  dataForCntReps.refTime = values.refTime;
  dataForCntReps.bodyHeight = values.neck2spineBase;
  dataForCntReps.bodyWidth = values.shoulder2shoulder;
  dataForCntReps.jointNeck = refFrames[0].joints[2];

  $.ajax({
    type: 'PUT',
    url: 'api/userexercise/reference/mostrecent/data/' + exerciseId + '/' + patientId,
    data: values,
    success: function (result) {
      window.location = redirectToUrl
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}


function showFeedback(accuracy, speed, exerciseId, patientId, isComplete) {
  $("#fdbkOK").click(function (e) {
    if(isComplete) {
      window.location = 'userexercise/session/end/practice/' +
        exerciseId + '/' + patientId;
    } else {
      window.location = 'userexercise/session/start/practice/' +
        exerciseId + '/' + patientId;
    }
  });

  let acc_words, spd_words;
  switch (true) {
    case(accuracy >= 0.9):
      acc_words = "Excellent! Your movement accuracy was very high.";
      break;
    case(accuracy < 0.9 && accuracy >= 0.75):
      acc_words = "Well done! Your movement accuracy was above average.";
      break;
    case(accuracy < 0.75 && accuracy >= 0.5):
      acc_words = "Not bad! Your movement accuracy is on the right track.";
      break;
    case(accuracy < 0.5):
      acc_words = "It looks like you had some difficulty with movement accuracy."
      break;
  }

  switch (true) {
    case(speed >= 1.2):
      spd_words = "You were going too fast. Try to slow down next time.";
      break;
    case(speed >= 0.5 && speed < 1.2):
      spd_words = "Well done! You were performing at a regular pace.";
      break;
    case(speed < 0.5):
      spd_words = "You were going too slow. Try a faster pace next time.";
      break;
  }

  document.getElementById("acc").innerHTML = acc_words;
  document.getElementById("spd").innerHTML = spd_words;

  // Get the modal
  let modal = document.getElementById('fdbkModal');
  // Open Modal
  modal.style.display = "block";
}


function savePractice() {
  const parsedURL = parseURL(window.location.pathname);
  let patientId = parsedURL.patientId;
  let exerciseId = parsedURL.exerciseId;
  let url ='api/userexercise/practice/mostrecent/data/' + exerciseId + '/';
  let isComplete = false;
  let values = {};
  values.bodyFrames = recentFrames_compressed;
  values.numRepsCompleted = localStorage.getItem("numRepsCompleted");
  //localStorage.removeItem("numRepsCompleted");

  //logged-in user is clinician
  if (patientId) {
    url = url + patientId;
  }
  if(setNumber === numSets) {
    values.weekEnd = new Date().getWeekNumber();
    isComplete = true;
  }

  // variables for feedback
  let acc;
  let spd;
  $.ajax({
    type: 'PUT',
    url: url,
    data: values,
    success: function (result) {
      acc = result.accuracy;
      spd = result.speed;
      console.log(acc, spd);
      // Modal popup for analysis
      showFeedback(acc, spd, exerciseId, patientId, isComplete);

    },
    error: function (result) {
      errorAlert(result);
    }
  })
}

function goTodashBoard() {
  window.location = 'dashboard';
}

function goToExercises() {

  const parsedURL = parseURL(window.location.pathname);
  let patientId = parsedURL.patientId;
  window.location = 'clinician/patientexercises/' + patientId;
}


(function ()
{
  let processing, canvas, ctx, ref_canvas, ref_ctx, exe_canvas, exe_ctx;
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
  //canvas dimension
  let width = 0;
  let height = 0;
  let radius=9; //radius of joint circle
  let circle_radius = 30; //radius of calibration circle
  //let jointType = [7,6,5,4,2,8,9,10,11,10,9,8,2,3,2,1,0,12,13,14,15,14,13,12,0,16,17,18,19]; //re visit and draw in a line
  let jointType = [6,5,4,2,8,9,10,9,8,2,3,2,1,0,12,13,14,13,12,0,16,17,18];//remove handtips and feet
  let notAligned = true; // whether person has aligned in circle for the first time or not
  let useTimer = true; // whether or not to use the startTimer() function
  // index of reference frame
  let ref_index = 0;
  // index of exercise frame
  let exe_index = 0;
  let parsedURL = parseURL(window.location.pathname);

  // value for countReps
  let nx_1stFrame, ny_1stFrame, nz_1stFrame; // neck position
  let bodyWidth; // shoulderLeft to shoulderRight
  let bodyHeight; // neck to spineBase
  // fetch data before start exercise

  if (isElectron())
  {
    document.addEventListener('DOMContentLoaded', function() {
      processing = false;
      //live canvas
      canvas = document.getElementById('outputCanvas');
      ctx = canvas.getContext('2d');
      drawGrids(ctx);
      drawFloorPlane(ctx);
      //reference canvas
      ref_canvas = document.getElementById('refCanvas');
      ref_ctx = ref_canvas.getContext('2d');
      drawGrids(ref_ctx);
      drawFloorPlane(ref_ctx);
      //exercise canvas
      exe_canvas = document.getElementById('exeCanvas');
      exe_ctx = exe_canvas.getContext('2d');
      drawGrids(exe_ctx);
      drawFloorPlane(exe_ctx);

      //get the canvas dimension
      width = canvas.width;
      height = canvas.height;
      liveFrames = [];
      localStorage.setItem('canStartRecording', false);

      openDB(function() {
        let getref = db.transaction(['bodyFrames']).objectStore('bodyFrames').get('refFrames');
        getref.onsuccess = function(e) {
          if(getref.result && getref.result.body && getref.result.body.length > 0 ) {
            try {
              refFrames_compressed = getref.result.body;
              refFrames = JSON.parse(pako.inflate(getref.result.body, { to: 'string' }));
              console.log("refFrames loaded locally");
            } catch (err) {
              console.log(err);
            }
          }
          showCanvas();
          console.log("show canvas called after getting referenceFrames");
        }

        let getrecent = db.transaction(['bodyFrames']).objectStore('bodyFrames').get('liveFrames');
        console.log("getrecent=", getrecent);
        getrecent.onsuccess = function(e) {
          if(getrecent.result && getrecent.result.body && getrecent.result.body.length > 0) {
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
    let refCanvas = document.getElementById("refCanvas");
    let exeCanvas = document.getElementById("exeCanvas");
    let outputCanvas = document.getElementById("outputCanvas");

    //start of creating reference
    if(parsedURL.mode === 'start'  && refFrames && refFrames.length === 0)
    {
      ref_index = 0;
      exe_index = 0;
      //showing the live view
      refCanvas.style.display = "none";
      exeCanvas.style.display = "none";
      outputCanvas.style.display = "block";
      let ctx = refCanvas.getContext('2d');
      //ctx.fillText("Click the Start button to record your first reference", canvas.width/2, canvas.height/20);
      drawGrids(ctx);
      drawFloorPlane(ctx);

    }
    // start of updating reference and practice
    else if((parsedURL.mode === 'start' || parsedURL.mode === 'end') && refFrames)
    {
      ref_index = 0;
      exe_index = 0;
      //show reference canvas only
      refCanvas.style.display = "block";
      exeCanvas.style.display = "none";
      outputCanvas.style.display = "none";
      let ctx = refCanvas.getContext('2d');
      drawGrids(ctx);
      drawFloorPlane(ctx);

    }
    //play state for updating reference and creating reference
    else if(parsedURL.mode === 'play' && parsedURL.type === 'reference')
    {
      ref_index = 0;
      exe_index = 0;
      //show live canvas only
      refCanvas.style.display = "none";
      exeCanvas.style.display = "none";
      outputCanvas.style.display = "block";
      let ctx = outputCanvas.getContext('2d');
      drawGrids(ctx);
      drawFloorPlane(ctx);
    }
    //play state for practice
    else if(parsedURL.mode === 'play' && parsedURL.type === 'practice')
    {
      ref_index = 0;
      exe_index = 0;
      //show live canvas and reference canvas
      refCanvas.style.display = "inline";
      exeCanvas.style.display = "none";
      outputCanvas.style.display = "inline";
      let ctx1 = refCanvas.getContext('2d');
      drawGrids(ctx1);
      drawFloorPlane(ctx1);
      let ctx2 = outputCanvas.getContext('2d');
      drawGrids(ctx2);
      drawFloorPlane(ctx2);

    }
    //stop state for updating reference and creating reference
    else if(parsedURL.mode === 'stop' && parsedURL.type === 'reference')
    {
      ref_index = 0;
      exe_index = 0;
      //show reference canvas
      refCanvas.style.display = "block";
      exeCanvas.style.display = "none";
      outputCanvas.style.display = "none";
      let ctx = refCanvas.getContext('2d');
      drawGrids(ctx);
      drawFloorPlane(ctx);

    }
    //stop state for exercise
    else if(parsedURL.mode === 'stop' && parsedURL.type === 'practice')
    {
      ref_index = 0;
      exe_index = 0;
      refCanvas.style.display = "inline";
      exeCanvas.style.display = "inline";
      outputCanvas.style.display = "none";
      let ctx1 = refCanvas.getContext('2d');
      drawGrids(ctx1);
      drawFloorPlane(ctx1);
      let ctx2 = exeCanvas.getContext('2d');
      drawGrids(ctx2);
      drawFloorPlane(ctx2);
    }
    //this case is used for error safety, should not be called normally
    else
    {
      ref_index = 0;
      exe_index = 0;
      console.log("State error occurs!");
    }
  }

  function drawGrids(ctx){
    // grid
    let bw = 500; // canvas.width
    let bh = 500; // canvas.height
    let p = -0.5; // padding
    let count = 0;
    ctx.beginPath();
    for (let x = 0; x <= bh; x += 100.3) {
        ctx.moveTo(p, x + p);
        ctx.lineTo(bw + p, x + p);
    }
    ctx.lineWidth=0.5;
    ctx.strokeStyle = "#525B74";
    ctx.stroke();
    ctx.closePath();
  }

  function drawFloorPlane(ctx) {
    ctx.strokeStyle = "none";
    ctx.fillStyle = '#F0F0F2';
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(100, 406);
    ctx.lineTo(400, 406);
    ctx.lineTo(500, 500);
    ctx.fill();

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
  function drawBody(parameters, ctx, color, jointColor, drawCircle = true){

    let body = parameters;
    jointType.forEach(function(jointType){
      drawJoints({cx: body.joints[jointType].depthX * width, cy: body.joints[jointType].depthY * height},ctx, jointColor);
    });
    if(drawCircle)
    {
      drawCenterCircle({
        x: width / 2, y: 200, r: circle_radius, nx: body.joints[2].depthX * width, ny: body.joints[2].depthY * height
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
    ctx.strokeStyle=color;
    ctx.stroke();
    ctx.closePath();
  }

  //function that draws each joint as a yellow round dot
  function drawJoints(parameters, ctx, color){

    let cx = parameters.cx;
    let cy = parameters.cy;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI*2); //radius is a global variable defined at the beginning
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  //function that draws the red Center Circle in ctx1 (canvasSKLT)
  function drawCenterCircle (parameters, ctx){

    //coordinate of the red circle
    let x = parameters.x;
    let y = parameters.y;
    //radius
    let r = parameters.r;
    //
    let neck_x = parameters.nx;
    let neck_y = parameters.ny;
    ctx.beginPath();
    //euclidean distance from head to calibration circle
    let dist = Math.sqrt(Math.pow((neck_x - x),2) + Math.pow((neck_y - y), 2))
    if(notAligned) {
      if(dist <= r){
        //When person's neck enters green circle && mode is 'play', recording will start.
        ctx.strokeStyle="Lime";
        let parsedURL = parseURL(window.location.pathname);
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
    ctx.lineWidth = 10;
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.closePath();
  }

  /*
   * diff_level = {(easy:0.5), (normal:0.75), (hard:0.9)}
   * base_thresh = 0.1
   *
   * returns [reps, direction_flag]
   * reps is either 0 or 1
   */
  function countReps(body, threshold_flag, diff_level, base_thresh, numReps) {

    let reps = 0;
    let norm, ref_norm; // the position of the joint-for-norm
    let d, ref_d; // the distance to the joint-for-norm in the corresponding axis
    // This is set when user is correctly positioned in circle
    // neck: 2
    if (dataForCntReps.axis == 'depthY') {
      ref_norm = dataForCntReps.jointNeck['depthY'];
      norm = ny_1stFrame;
      ref_d = dataForCntReps.bodyHeight;
      d = bodyHeight;
    } else if (dataForCntReps.axis == 'depthX') {
      //should be close to leftShoulderX
      ref_norm = dataForCntReps.jointNeck['depthX'] - dataForCntReps.bodyWidth / 2;
      norm = nx_1stFrame - bodyWidth / 2;
      ref_d = dataForCntReps.bodyWidth;
      d = bodyWidth;
    }

    let currR = ref_d / d * (body.joints[dataForCntReps.joint][dataForCntReps.axis] - norm) + ref_norm;
    console.log("ref_d: " + ref_d);
    console.log("ref_norm: " + ref_norm);
    console.log("d: " + d);
    console.log("norm: " + norm);
    console.log("currR: " + currR);

    let ref_min = dataForCntReps.refMin; //upper
    let ref_max = dataForCntReps.refMax; //lower
    let range = ref_max - ref_min;
    let top_thresh, bottom_thresh;
    console.log("ref_min, ref_max: " + ref_min + "\t" + ref_max);
    if (direction === 'up') {
      top_thresh = ref_min + range * (1-diff_level);
      bottom_thresh = ref_max - range * base_thresh;
    } else if (direction === 'down') {
      top_thresh = ref_min + range * base_thresh;
      bottom_thresh = ref_max - range * (1-diff_level);
    }
    console.log("top_thresh: " + top_thresh);
    console.log("bottom_thresh: " + bottom_thresh);

    let n = parseInt(document.getElementById("cntReps").innerHTML);
    if (n < numReps) {
      // direction group: (down, right), (up, left)
      if ((threshold_flag === 'up') && (currR < top_thresh)) {
        // goes up and pass the top_thresh
        // only increase reps when moving in the same direction as defined in the exercise:
        if (threshold_flag === direction && isBodyInPlane(nz_1stFrame, body.joints[2].cameraZ)) {
          reps++;
        }
        return [reps, 'down'];
      } else if ((threshold_flag === 'down') && (currR > bottom_thresh)) {
        // goes down and pass the bottom_thresh
        // only increase reps when moving in the same direction as defined in the exercise:
        if (threshold_flag === direction && isBodyInPlane(nz_1stFrame, body.joints[2].cameraZ)) {
          reps++;
        }
        return [reps, 'up'];
      } else {
        // console.log("No flip");
        return [reps, threshold_flag];
      }
    } else if (n === numReps && threshold_flag !== direction) {
      // goes back to the resting position
      if ((threshold_flag === 'up') && (currR < top_thresh) || (threshold_flag === 'down') && (currR > bottom_thresh)) {
        setTimeout(action('stop', 'practice'), 2000);
        // action('stop', 'practice');
      }
      return [reps, threshold_flag];
    }
  }

  // patient reaching out for button makes body NOT in plane
  function isBodyInPlane(init, curr) {
    if (init * 0.6 < curr && init * 1.2 > curr){
      return true;
    }
    return false;
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
    ctx.font="20px Arial";
    (notAligned) ? ctx.fillStyle = "red" : ctx.fillStyle = "#23D160";
    ctx.textAlign = "center";
    ctx.fillText("Live View", canvas.width/2, canvas.height/20);
    drawGrids(ctx);
    drawFloorPlane(ctx);

    ref_ctx.font="20px Arial";
    //ref_ctx.fillStyle = "red";
    ref_ctx.fillStyle = "#1E89FB";
    ref_ctx.textAlign = "center";
    ref_ctx.fillText("Reference", canvas.width/2, canvas.height/20);
    drawGrids(ref_ctx);
    drawFloorPlane(ref_ctx);

    exe_ctx.font="20px Arial";
    //exe_ctx.fillStyle = "red";
    exe_ctx.fillStyle = "#7BE39F";
    exe_ctx.textAlign = "center";
    exe_ctx.fillText("Exercise", canvas.width/2, canvas.height/20);
    drawGrids(exe_ctx);
    drawFloorPlane(exe_ctx);

    //draw each joint circles when a body is tracked
    bodyFrame.bodies.forEach(function (body)
    {
      if (body.tracked)
      {
        //location of the neck
        let neck_x = body.joints[2].depthX;
        let neck_y = body.joints[2].depthY;

        //draw the body skeleton in live canvas
        drawBody(body,ctx, liveBodyColor, commonBlue);

        document.addEventListener('timer-done', function(evt){
          nx_1stFrame = neck_x;
          ny_1stFrame = neck_y;
          nz_1stFrame = body.joints[2].cameraZ;
          bodyWidth = body.joints[8].depthX - body.joints[4].depthX;
          bodyHeight = body.joints[0].depthY - body.joints[2].depthY;

          let st = new Date().getTime();
          if ((parsedURL.type === 'reference') && (parsedURL.mode === 'play')) {
            localStorage.setItem("refStart", st);
          }
        });

        if(JSON.parse(localStorage.getItem('canStartRecording')) === true)
        {
          //filter joints, remove fingertips and spineShoulder for they are not used
          body.joints.splice(20,5);
          liveFrames.push(body);
          if(liveFrames.length >= MAX_BODYFRAMES_STORED)
          {
            framesExceededLimit = true;
            errorAlert("liveFrame data capacity of 4,400 bodyFrames has been reached.")
          }
          if ((parsedURL.type === 'practice') && (parsedURL.mode === 'play')) {
            // countReps and timing
            console.log("Here: " + dataForCntReps.diffLevel + "\t" + threshold_flag);

            let tempCnt = countReps(body, threshold_flag, dataForCntReps.diffLevel, 0.1, dataForCntReps.numReps);
            // let tempCnt = countReps(body, threshold_flag, dataForCntReps.diffLevel, 0.25);

            threshold_flag = tempCnt[1];
            let n = parseInt(document.getElementById("cntReps").innerHTML) + parseInt(tempCnt[0]);
            document.getElementById("cntReps").innerHTML = n;
            localStorage.setItem("numRepsCompleted", n);
          }
        }
      }
    });

    //if the patient is in position and doing a practice session
    if(JSON.parse(localStorage.getItem('canStartRecording')) === true && (parsedURL.type === 'practice') && (parsedURL.mode === 'play')) {

      //draw in the reference canvas
        drawBody(refFrames[ref_index], ref_ctx, commonBlue,refJointColor, false);
        //display one frame of reference every 2 frames of live frame captured
        //we can manipulate the number to control the display speed
        ref_index = (ref_index + 1) % refFrames.length;
    }

    //check if it is in the state of displaying reference, if reference exists
    //1. end of creating reference and end of updating
    //2. start of updating
    //3. start of practice
    //4. end of practice
    //in theses cases, the in-position will not be checked
    else if (((parsedURL.type === 'reference') && (parsedURL.mode === 'stop')) ||
      ((parsedURL.type === 'reference') && (parsedURL.mode === 'start')  && refFrames && (refFrames.length > 0)) ||
      ((parsedURL.type === 'practice') && (parsedURL.mode === 'start' || parsedURL.mode === 'end')) ||
      ((parsedURL.type === 'practice') && (parsedURL.mode === 'stop'))
    )
    {
      //draw in the reference canvas
      drawBody(refFrames[ref_index], ref_ctx,commonBlue, refJointColor, false);
      //if in the end of practice state, we will also display the latest exercise, with the same frequency as the reference
      if((parsedURL.type === 'practice') && (parsedURL.mode === 'stop'))
      {
        drawBody(recentFrames[exe_index], exe_ctx,liveBodyColor,commonBlue ,false);
      }
      ref_index = (ref_index + 1) % refFrames.length;
      if(recentFrames) {
        exe_index = (exe_index + 1) % recentFrames.length;
      }
    }
  };

  function isElectron() {
    return 'Bridge' in window;
  }
})();
