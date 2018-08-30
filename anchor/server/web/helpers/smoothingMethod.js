// 3 smoothing functions
function add(a,b) {
  return a+b;
}

function smoothAvg (list, degree) {
  let i;
  let smoothed = [];
  let len = list.length - degree + 1;
  for (i=0; i<len; i++){
    let avg = list.slice(i, i+degree).reduce(add,0) / degree;
    smoothed.push(avg);
  }
  return smoothed;
}

function smoothTri (list, degree){
  let i, j, sum;
  let weight=[];
  let window=degree*2-1;
  for (i=1;i<window+1;i++){
    weight.push(degree-Math.abs(degree-i))
  }
  let smoothed=[];
  let len = list.length-window;
  for (i=0;i<len;i++){
    sum=0;
    for(j=0;j<window;j++)
      sum+=list[i+j]*weight[j];
    smoothed[i]=sum/weight.reduce(add, 0);
  }
  return smoothed;
}

function smoothGauss(list,degree){
  let i, j, sum;
  let weight=[];
  let window=degree*2-1;
  for (i=0;i<window;i++){
    weight.push(1/(Math.exp((4*(i-degree+1)/window)**2)));
  }
  let smoothed=[];
  let len = list.length-window;
  for (i=0;i<len;i++){
    sum=0;
    for(j=0;j<window;j++)
      sum+=list[i+j]*weight[j];
    smoothed[i]=sum/weight.reduce(add, 0);
  }
  return smoothed;
}

module.exports = function smoothingMethod(list, degree, method="gauss") {
  if (method === "gauss") return smoothGauss(list,degree);
  else if (method === "tri") return smoothTri(list, degree);
  else if (method === "avg") return smoothAvg(list, degree);
}
