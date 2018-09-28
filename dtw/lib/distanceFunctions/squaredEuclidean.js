//Added distance formula for points of n-dimension
function distance_formula(a, b){
  var sum = 0;
  var n;
  for (n = 0; n < a.length; n++) {
    sum += Math.pow(a[n] - b[n], 2)
  }
  return Math.sqrt(sum);
}

var distance = function (x, y) {
    var difference = distance_formula(x, y);
    var squaredEuclideanDistance = difference * difference;
    return squaredEuclideanDistance;
};

module.exports = {
    distance: distance
};
