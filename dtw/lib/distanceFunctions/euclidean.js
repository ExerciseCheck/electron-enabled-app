var distance = function (x, y) {
  var sum = 0;
  var n;
  for (n = 0; n < x.length; n++) {
    sum += Math.pow(x[n] - y[n], 2)
  }
  var euclideanDistance = Math.sqrt(sum);
  return euclideanDistance;
};

module.exports = {
    distance: distance
};
