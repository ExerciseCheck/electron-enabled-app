//function for coarse segmentation, used for offline speed analysis
//x, y ,z: 3D trajectory
//theDirection: the direction defined by the exercise
//time_thresh: the threshold below which not included, default 30 = 1 sec
// arr is 3D: [(x1,y1,z1), (x2,y2,z2),...]
module.exports = function getSpeed(arr) {
  console.log(arr[0]);

  let speedArray=[];
  let i;
  let window = 15; // the window
  for (i=0; i<arr.length - window; i++) {
    let v = Math.abs(
      Math.sqrt(Math.pow(arr[i+window][0] - arr[i][0],2) + Math.pow(arr[i+window][1] - arr[i][1],2) + Math.pow(arr[i+window][2] - arr[i][2],2)));
    speedArray.push(v)
  }
  let thresh = Math.max.apply(null, speedArray) / 5.0; //Movement Arrest Period Ratio
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

