//function for coarse segmentation, used for offline speed analysis
//x: the 1D trajectory
//theDirection: the direction defined by the exercise
//time_thresh: the threshold below which not included, default 30 = 1 sec
module.exports = function getSegmentation(x, theDirection, time_thresh) {
  let ifIncreased; // direction flag
  if(theDirection === 'L2R' || theDirection === 'down') {
    ifIncreased = true;
  } else if (theDirection === 'R2L' || theDirection === 'up') {
    ifIncreased = false;
  } else {
    console.log("You should not see this")
  }

  let idx=[];
  for (let i=0; i<x.length - 1; i++) {
    let v = x[i+1] - x[i];
    if(v >= 0) {
      idx.push([i, ifIncreased]); //true if moving in the same direction as the exercise
    } else {
      idx.push([i, !ifIncreased]);
    }
  }
  // console.log("first: " + idx[0]);
  // console.log("last: " + idx[idx.length-1]);

  let idx_st=[]; // records the idx of the first true
  let timing = [];
  let ifFirst = true; //if is the first true
  //one rep is the first true to last false, incl
  let ii, j;
  for (ii=0; ii<idx.length-1; ii++) {
    if(idx[ii][1] && ifFirst) {
      idx_st.push(idx[ii][0]);
      ifFirst = false;
    } else if (idx[ii][1] === false && idx[ii+1][1]) {
      ifFirst = true;
    }
  }
  if (idx[idx.length-1][1] === false) {
    idx_st.push(idx[idx.length-1][0] + 1);
  }

  for (j=1; j<idx_st.length; j++) {
    let delta = idx_st[j] - idx_st[j-1];
    if(delta >= time_thresh) {
      timing.push(delta);
    }
  }

  return timing;
}

