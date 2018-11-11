'use strict';

// api/table/refexercise: all ref ex data


function downloadData(id) {
  $(this).val('clicked');
  var exerciseData = [];
  var exerciseDataString;
  console.log(typeof exerciseData);
  $.ajax({
    type: 'GET',
    url: '/api/table/userexercise/reference' + '/' + '5be60bf4efa3ed3cbcfe856b',
    success: function (result) {
      console.log("data=", result.data[0].exerciseId);
      for ( var i=0; i<result.data.length; i++ )
      {
        if(result.data[i].exerciseId == id)
        {
          console.log("Found exercise", id);
          // console.log(result.data[i].bodyFrames.length);
          result.data[i].bodyFrames = JSON.parse(pako.inflate(result.data[i].bodyFrames, { to: 'string' }));
          exerciseDataString = exerciseDataString + JSON.stringify(result.data[i].bodyFrames);
          console.log(exerciseDataString.length)
          // exerciseData.push(result.data[i].bodyFrames);
          exerciseData.push(exerciseDataString);
        }
      }
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });

  console.log("typeof:", typeof exerciseDataString);
  // var blob = new Blob(exerciseData, {type: "text/plain;charset=utf-8"});
  // var blob = new Blob(exerciseData[0], {type: "application/json"});
    console.log(typeof String(exerciseDataString), String(exerciseDataString));
    var blob = new Blob(String(exerciseDataString), {type: "text/plain;charset=utf-8"});
    // var file = new File(String(exerciseDataString), Date()+".txt", {type: "text/plain;charset=utf-8"});
    // saveAs(file)
    saveAs(file, Date() + '.txt');

  // saveAs(blob, "works.txt");
  console.log("Done downloading!");
}

function deleteDoc(id) {
  const button = $('#delete' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: 'api/exercise/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('Exercise Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}

function editDoc(id) {
  window.location = 'exercise/edit/' + id
}
