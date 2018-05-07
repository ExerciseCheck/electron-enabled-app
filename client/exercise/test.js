var XLSX = require('xlsx');
var workbook = XLSX.readFile('output.xlsx');
var sheet_name_list = workbook.SheetNames;
var bufferBodyFrames = [];
sheet_name_list.forEach(function(y) {
    var worksheet = workbook.Sheets[y];
    var numFrame = 0;
    // find out the number of frames storaged in sheet
    for(z in worksheet) {
        if(z[0] === '!')
          continue;
        //parse out the column, row, and value
        cellindex =  z.match(/[a-zA-Z]+|[0-9]+/g)
        var col = string2col(cellindex[0]);
        var row = parseInt(cellindex[1]);
        if (row>numFrame)
          numFrame = row;
      }

    for(var i=0; i<numFrame; i++){
      var joint = [];
      for (var j=0;j<25*11;j++){
        index = col2string(j+1)+(i+1).toString();
        joint.push(worksheet[index].v);
      }
      var bodyFrame = bodyFrameTemplate(joint);
      bufferBodyFrames.push(bodyFrame);

    }
});

function string2col(str){ // convert Excel Col ID to number, ex. 'A' to 1 'B' to 2
  var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, j, val = 0;
  for (i = 0, j = str.length - 1; i < str.length; i += 1, j -= 1) {
    val += Math.pow(base.length, j) * (base.indexOf(str[i]) + 1);
  }
  return val;
};

function col2string(val){
  var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',str = "";
  for (; val>0; val = Math.floor((val-1)/26)){
    str = base[(val - 1)%26] + str;
  }
  return str;
}
// 27 1
function bodyFrameTemplate(joint){

  var attributename = [
      "depthX",
      "depthY",
      "colorX",
      "colorY",
      "cameraX",
      "cameraY",
      "cameraZ",
      "orientationX",
      "orientationY",
      "orientationZ",
      "orientationW"];

  var bodyFrame = {
    bodies:[
      {
        bodyIndex: 0,
        tracked: true,
        leftHandState: 0,
        rightHandState: 0,
        trackingID: "1234567890",
      },
      {
        bodyIndex: 1,
        tracked: false,
      },
      {
        bodyIndex: 2,
        tracked: false,
      },
      {
        bodyIndex: 3,
        tracked: false,
      },
      {
        bodyIndex: 4,
        tracked: false,
      },
      {
        bodyIndex: 5,
        tracked: false,
      }
    ]
  };

  bodyFrame.bodies.joint  = [];
  for(var i = 0; i<25; i++){
    var body = {};
    for(var j=0; j<11; j++){
      body[attributename[j]] = joint[i*11+j];
    }
    bodyFrame.bodies.push(body);
  }
}
