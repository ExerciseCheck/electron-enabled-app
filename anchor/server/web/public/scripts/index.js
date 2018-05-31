(function ()
{
  let processing, canvas, ctx;
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
  var width = 0;
  var height = 0;
  var radius=9;
  var jointType = [7,6,5,4,2,8,9,10,11,10,9,8,2,3,2,1,0,12,13,14,15,14,13,12,0,16,17,18,19];//re visit and draw in a line
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
  function drawBody(parameters){
    var body = parameters;
    var ctx = 'ctx' in parameters ? parameters.ctx: ctx1;
    //drawCircle(50, 50, 10, "green");
    //jointType = [7,6,5,4,2,8,9,10,11,10,9,8,2,3,2,1,0,12,13,14,15,14,13,12,0,16,17,18,19];//re visit and draw in a line
    jointType.forEach(function(jointType){
      drawJoints({cx: body.joints[jointType].depthX * width, cy: body.joints[jointType].depthY * height, ctx:ctx});
    });
    drawCenterCircle({
      x: width / 2, y: height / 5, r: 50, nx: body.joints[2].depthX * width, ny: body.joints[2].depthY * height, ctx:ctx
    });

    ctx.beginPath();
    ctx.moveTo(body.joints[7].depthX * width, body.joints[7].depthY * height);
    jointType.forEach(function(jointType){
      ctx.lineTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
      ctx.moveTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
    });
    ctx.lineWidth=10;
    ctx.strokeStyle='blue';
    ctx.stroke();
    ctx.closePath();
  }

  function drawJoints(parameters){
    var cx = parameters.cx;
    var cy = parameters.cy;
    var ctx = "ctx" in parameters? parameters.ctx: ctx1;
    ctx.beginPath();
    ctx.arc(cx,cy,radius,0,Math.PI*2); //radius is a global variable defined at the beginning
    ctx.closePath();
    ctx.fillStyle = "yellow";
    ctx.fill();
  }

  // Draw Center Circle in ctx1 (canvasSKLT)
  function drawCenterCircle(parameters){
    var x = parameters.x;
    var y = parameters.y;
    var r = parameters.r;
    var nx = parameters.nx;
    var ny = parameters.ny;
    var ctx = "ctx" in parameters? parameters.ctx:ctx1;
    ctx.beginPath();
    if(nx > x-r && nx < x+r && ny > y-r && ny < y+r)
      ctx.strokeStyle="green";
    else
      ctx.strokeStyle="red";

    ctx.arc(x, y,r,0,Math.PI*2);
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle="black";
  }

  //added
  window.Bridge.aOnBodyFrame = (bodyFrame) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let index = 0;
    //draw each joint circles
    bodyFrame.bodies.forEach(function (body) {
      if (body.tracked) {

        /*
        for (let jointType in body.joints) {
          let joint = body.joints[jointType];
          ctx.fillStyle = colors[index];
          ctx.fillRect(joint.depthX * 512, joint.depthY * 424, 10, 10);
        }
        index++;

        var ctx = 'ctx' in parameters ? parameters.ctx: ctx1;
        //drawCircle(50, 50, 10, "green");
        */
        jointType.forEach(function(jointType)
        {
          var cx = body.joints[jointType].depthX * width;
          var cy = body.joints[jointType].depthY * height;
          //var ctx = "ctx" in parameters? parameters.ctx: ctx1;
          ctx.beginPath();
          ctx.arc(cx,cy,radius,0,Math.PI*2); //radius is a global variable defined at the beginning
          ctx.closePath();
          ctx.fillStyle = "yellow";
          ctx.fill();
        });

        //draw the head circle
        var x = width / 2;
        var y = height/5;
        var r = 25;
        var nx = body.joints[2].depthX * width;
        var ny = body.joints[2].depthY * height;

        ctx.beginPath();
        if(nx > x-r && nx < x+r && ny > y-r && ny < y+r)
          ctx.strokeStyle="green";
        else
          ctx.strokeStyle="red";
        ctx.arc(x, y,r,0,Math.PI*2);
        ctx.stroke();
        ctx.closePath();
        ctx.strokeStyle="black";

        //connect joints and head
        ctx.beginPath();
        ctx.moveTo(body.joints[7].depthX * width, body.joints[7].depthY * height);
        jointType.forEach(function(jointType){
          ctx.lineTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
          ctx.moveTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
        });
        ctx.lineWidth=10;
        ctx.strokeStyle='blue';
        ctx.stroke();
        ctx.closePath();
      }
    });
  };

  function isElectron() {
    return 'Bridge' in window;
  }
})();
