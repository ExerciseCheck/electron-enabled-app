//function for coarse segmentation, used for offline speed analysis
//x: the 1D trajectory
//theDirection: the direction defined by the exercise
//time_thresh: the threshold below which not included, default 30 = 1 sec
module.exports = function getSpeed(x,y,z) {
  console.log(x[0], y[0], z[0]);

  // consider 3-D
  let speedArray=[];
  let i;
  for (i=0; i<x.length - 15; i++) {
    let v = Math.abs(Math.sqrt(Math.pow(x[i+15] - x[i],2) + Math.pow(y[i+15] - y[i],2) + Math.pow(z[i+15] - z[i],2)));
    speedArray.push(v)
  }
  let thresh = Math.max.apply(null, speedArray) / 5.0; //Movement Arrest Period Ratio
  //console.log("thresh: " + thresh);
  //let filtered = speedArray.filter(v => v > thresh); //returns elements
  //console.log("filtered: " + filtered);

  //console.log("Speed Array: " + speedArray);

  let sumSpeed = 0;
  let cnt = 0;
  for (i=0; i<speedArray.length; i++){
    if(speedArray[i] > thresh){
      sumSpeed += speedArray[i];
      cnt ++;
    }
  }
  let avgSpeed = sumSpeed / cnt;
  console.log("length: " + speedArray.length);
  console.log("filtered length: " + cnt);

  return avgSpeed;
}

