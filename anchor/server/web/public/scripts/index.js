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
    let head_x = parameters.nx;
    let head_y = parameters.ny;
    ctx.beginPath();
    //euclidean distance from head to calibration circle
    let dist = Math.sqrt(Math.pow((head_x - x),2) + Math.pow((head_y - y), 2))
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
    //draw each joint circles
    bodyFrame.bodies.forEach(function (body) {
      if (body.tracked) {
        //draw the body skeleton
        drawBody(body,ctx)
      }
    });
  };

  function isElectron() {
    return 'Bridge' in window;
  }
})();
