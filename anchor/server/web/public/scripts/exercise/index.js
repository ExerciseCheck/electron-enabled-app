'use strict';

// api/table/refexercise: all ref ex data
var userData = {}
var refExerciseData = {}

function getValues(result, db, a) {
    if(result){
      Object.keys(result).forEach(function (k) {
          if (typeof result[k] === 'object') {
              getValues(result[k], db, [].concat(a, k));
              return;
          }
          if(db === 'user')
            userData[[].concat(a, k).join('_')] = result[k];
          else if(db === 'refExercise')
            refExerciseData[[].concat(a, k).join('_')] = result[k];
      });
    }
    else{
      console.log("Skipping over null values")
    }
}

function downloadData(id, exerciseName) {
  $(this).val('clicked');
  let userList = {}
  let patientUserIds = []

  $.ajax({
    type: 'GET',
    url: '/api/table/users?search[value]=""',
    success: function (result) {
      getValues(result, 'user');
    },
    async: false,
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
  console.log("userData=", userData);

  patientUserIds = jQuery.map(Object.keys(userData), function(val, i) {
  if (val.indexOf("__id") != -1) {
    return userData[val];
    }
  });

  console.log("IDs=", patientUserIds)

  for(var i=0; i<patientUserIds.length; i++)
  {
    $.ajax({
      type: 'GET',
      url: '/api/table/userexercise/reference' + '/' + patientUserIds[i],
      success: function (result) {
        for ( var i=0; i<result.data.length; i++ )
        {
          if(result.data[i].exerciseId == id)
          {
            // Decompress the data and put it back into the result variable
            result.data[i].bodyFrames = JSON.parse(pako.inflate(result.data[i].bodyFrames, { to: 'string' }));
          }
        }
        console.log("data=", result);
        getValues(result, 'refExercise');
      },
      async: false,
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
  // console.log("userData:", JSON.stringify(userData));
  var file = new File([JSON.stringify(refExerciseData)], {type: "text/plain;charset=utf-8"});
  let date = new Date();
  let filename = id + '_' + date.toLocaleTimeString() + '_' + '.json' ;
  saveAs(file, filename);
  console.log("Data ready for download");
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
