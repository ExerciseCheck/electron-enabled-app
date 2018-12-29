'use strict';


function savePracticeToFile(result, userId, exerciseName, exerciseId, patientName) {
  // Initialize workbook
  var wb = {SheetNames:[], Sheets:{}};
  wb.Props = {
              Title: "ExerciseCheck data",
              Subject: userId,
              Author: "Boston University",
              CreatedDate: new Date()
      };

  let completeSheet = [];
  result.forEach(function(collection) {
    if(collection.exerciseId === exerciseId)
    {
      // console.log("collection:", collection);
      wb.SheetNames.push(collection.createdAt.replace(/:\s*/g, "-").replace(".", " "));
      collection.sets.forEach(function(set){
        set.bodyFrames.forEach(function(frame) {
          let eachRow = [];
          frame.joints.forEach(function(joint) {
            eachRow.push(joint.cameraX, joint.cameraY, joint.cameraZ, joint.colorX, joint.colorY, joint.depthX, joint.depthY, joint.orientationW, joint.orientationX, joint.orientationY, joint.orientationZ)
          });
          completeSheet.push(eachRow);
        })

      });
    }
  });

  console.log("SheetNames:", wb.SheetNames);
  // Workbook format:
  // 1. Each sheet is a reference exercise and sheet name is the timestamp
  // 2. Each row of the sheet represents a bodyFrame has 220 data-points i.e. 20 joints * 11 data points -> joint[0].cameraX, joint[0].cameraY...joint[0].orientationY, joint[0].orientationZ.....joint[19].orientationY, joint[19].orientationZ.
  // Row sample: joint[0].cameraX, joint[0].cameraY...joint[0].orientationY, joint[0].orientationZ.....joint[19].orientationY, joint[19].orientationZ.
  // 3. Each sheet has as many rows as the bodyFrames recorded for that reference exercise
  // 4. If there are more than one reference exercise (old stale data which we aren't deleting right now) then multiple sheets will be created in the workbook based on timestamp

  var ws = XLSX.utils.aoa_to_sheet(completeSheet);
  wb.SheetNames.forEach(function(sheet) {
    wb.Sheets[sheet] = ws;
  });

  var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
  function s2ab(s) {
          var buf = new ArrayBuffer(s.length);
          var view = new Uint8Array(buf);
          for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
          return buf;
  }
  let date = new Date();
  let filename = patientName + '_' + exerciseName + '_' + date.toLocaleTimeString() ;
  saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), filename + '.xlsx');
  console.log("Data ready for download!");
}


function savereferenceToFile(result, userId, exerciseName, exerciseId, patientName) {
  // Initialize workbook
  var wb = {SheetNames:[], Sheets:{}};
  wb.Props = {
    Title: "ExerciseCheck data",
    Subject: userId,
    Author: "Boston University",
    CreatedDate: new Date()
  };

  let completeSheet = [];
  result.forEach(function(collection) {
    if(collection.exerciseId === exerciseId)
    {
      // console.log("collection:", collection);
      wb.SheetNames.push(collection.createdAt.replace(/:\s*/g, "-").replace(".", " "));
      collection.bodyFrames.forEach(function(frame) {
          let eachRow = [];
          frame.joints.forEach(function(joint) {
            eachRow.push(joint.cameraX, joint.cameraY, joint.cameraZ, joint.colorX, joint.colorY, joint.depthX, joint.depthY, joint.orientationW, joint.orientationX, joint.orientationY, joint.orientationZ)
          });
          completeSheet.push(eachRow);
        })
    }
  });

  console.log("SheetNames:", wb.SheetNames);
  // Workbook format:
  // 1. Each sheet is a reference exercise and sheet name is the timestamp
  // 2. Each row of the sheet represents a bodyFrame has 220 data-points i.e. 20 joints * 11 data points -> joint[0].cameraX, joint[0].cameraY...joint[0].orientationY, joint[0].orientationZ.....joint[19].orientationY, joint[19].orientationZ.
  // Row sample: joint[0].cameraX, joint[0].cameraY...joint[0].orientationY, joint[0].orientationZ.....joint[19].orientationY, joint[19].orientationZ.
  // 3. Each sheet has as many rows as the bodyFrames recorded for that reference exercise
  // 4. If there are more than one reference exercise (old stale data which we aren't deleting right now) then multiple sheets will be created in the workbook based on timestamp

  var ws = XLSX.utils.aoa_to_sheet(completeSheet);
  wb.SheetNames.forEach(function(sheet) {
    wb.Sheets[sheet] = ws;
  });

  var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
  function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  }
  let date = new Date();
  let filename = patientName + '_' + exerciseName + '_' + date.toLocaleTimeString() ;
  saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), filename + '.xlsx');
  console.log("Data ready for download!");
}

function downloadDataForPractice(userAndExerciseIds, id) {
  successAlert('Data is being prepared, please wait.');
  var userId = userAndExerciseIds.split(",")[0]
  var exerciseId = userAndExerciseIds.split(",")[1]
  var exerciseName = userAndExerciseIds[2].split(/[\s,]+/).join("_")
  var patientName = userAndExerciseIds[3].split(/[\s,]+/).join("_")
  $(this).val('clicked');

  $.ajax({
    type: 'GET',
    url: '/api/practice/' + id,
    success: function (result) {

      for ( var i=0; i<result.sets.length; i++ )
      {
        result.sets[i].bodyFrames = JSON.parse(pako.inflate(result.sets[i].bodyFrames, { to: 'string' }));
      }
      console.log("data=", result);
      savePracticeToFile([result], userId, exerciseName, exerciseId, patientName);
    },
    async: false,
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function downloadDataForReference(userAndExerciseIds, id) {
  successAlert('Data is being prepared, please wait.');
  var userId = userAndExerciseIds[0]
  var exerciseId = userAndExerciseIds[1]
  var exerciseName = userAndExerciseIds[2].split(/[\s,]+/).join("_")
  var patientName = userAndExerciseIds[3].split(/[\s,]+/).join("_")

  $(this).val('clicked');

  $.ajax({
    type: 'GET',
    url: '/api/reference/' + id,
    success: function (result) {
      result.bodyFrames = JSON.parse(pako.inflate(result.bodyFrames, { to: 'string' }));

      console.log("data=", result);
      savereferenceToFile([result], userId, exerciseName, exerciseId, patientName);
    },
    async: false,
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}


function deleteDoc(id) {
  const button = $('#delete' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url : 'api/userexercise/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('UserExercise Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}

function editDoc(id) {
  window.location = '../userexercise/' + id
}

function showRecordedExercise(id) {
  window.location =  "../refexercises/play/"+id;

}
