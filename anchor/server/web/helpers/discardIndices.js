//function for segmentation based on DTW path, used for offline speed analysis
//x: the 1D trajectory
module.exports = function discardIndices(x, threshold) {
  let i;
  let isZero = [];
  isZero.push(0);
  for (i=1; i<x.length; i++){
    let path_speed = x[i] - x[i-1];
    if(path_speed === 0){
      isZero.push(1);
    } else {
      isZero.push(0);
    }
  }
  isZero.push(0);
  console.log(x.length);
  console.log(isZero.length);

  let absDiff = [];
  for (i=0; i<isZero.length; i++ ){
    let diff = isZero[i] - isZero[i-1];
    if(diff === 0){
      absDiff.push(0);
    } else {
      // diff is either 1 or -1
      absDiff.push(1);
    }
  }

  let rangesOdd = [];
  let rangesEven = []; // length should be equal
  let isOdd = true;
  console.log(absDiff.length);

  for (i=0; i<absDiff.length; i++){
    let n = absDiff[i];
    if( n === 1 && isOdd){
      rangesOdd.push(i);
      isOdd = false;
    } else if( n === 1 && !isOdd){
      rangesEven.push(i);
      isOdd = true;
    }
  }
  console.log(rangesOdd);
  console.log(rangesEven);
  let discard = 0;
  for (i=0; i<rangesEven.length; i++){
    let delta = rangesEven[i] - rangesOdd[i];
    if (delta > threshold) {
      discard += delta;
    }
  }
  console.log(discard);
  return discard;
}

