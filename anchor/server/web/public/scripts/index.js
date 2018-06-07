(function () {
  let processing, canvas, ctx;
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];

  if (isElectron()) {
    document.addEventListener('DOMContentLoaded', function() {
      processing = false;
      canvas = document.getElementById('outputCanvas');
      ctx = canvas.getContext('2d');
      window.Bridge.eStartKinect();

    });
  }

window.Bridge.aOnBodyFrame = (bodyFrame) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let index = 0;
    let frames = new Array();
    let d = JSON.parse(localStorage.getItem('data')) || [];

    bodyFrame.bodies.forEach(function (body) {
      if (body.tracked) {
        for (let jointType in body.joints) {
          let joint = body.joints[jointType];
          ctx.fillStyle = colors[index];
          ctx.fillRect(joint.depthX * 512, joint.depthY * 424, 10, 10);
        }
        index++;
        //document.write(localStorage.getItem('bool'));
        if(localStorage.getItem('bool') == 'yes') {
          //document.write("RECORDING");
          frames.push(body);
          d.push(frames);
          localStorage.setItem('data', JSON.stringify(d));
        }
      }
    });
  };

  function isElectron() {
    return 'Bridge' in window;
  }
})();
