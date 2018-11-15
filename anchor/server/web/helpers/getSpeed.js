//function for coarse segmentation, used for offline speed analysis
//x: the 1D trajectory
//theDirection: the direction defined by the exercise
//time_thresh: the threshold below which not included, default 30 = 1 sec
module.exports = function getSpeed(x,y,z) {
  // consider 3-D
  let speedArray=[];
  let i;
  for (i=0; i<x.length - 1; i++) {
    let v = Math.abs(Math.sqrt(Math.pow(x[i+1] - x[i],2) + Math.pow(y[i+1] - y[i],2) + Math.pow(z[i+1] - z[i],2)));
    speedArray.push(v)
  }
  let thresh = Math.max(speedArray) / 10.0; //Movement Arrest Period Ratio

  //let filtered = speedArray.filter(v => v > thresh); //returns elements

  let sumSpeed = 0;
  for (i=0; i<speedArray.length; i++){
    if(speedArray[i] > thresh){
      sumSpeed += speedArray[i];
    }
  }
  let avgSpeed = sumSpeed / speedArray.length;
  return avgSpeed;
}

