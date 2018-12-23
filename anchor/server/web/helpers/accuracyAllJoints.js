// squaredEuclidean
// align ref_joint and prac_joint using path
// ref_joint and prac_joint in 3D: [(x1,y1,z1), (x2,y2,z2),...]
// path in 2D: [[0,0],[1,0],[2,1],[3,2],...]

function distance_formula(a, b){
  let sum = 0;
  let n;
  for (n = 0; n < a.length; n++) {
    sum += Math.pow(a[n] - b[n], 2)
  }
  return Math.sqrt(sum);
}

module.exports = function calculateAccOther(path, ref_joint, prac_joint) {

    let err = 0;
    let i;
    for (i=0; i<path.length; i++){
      err += distance_formula(ref_joint[path[i][0]], prac_joint[path[i][1]]);
    }

    err = err/len(path);
    return err;
}

