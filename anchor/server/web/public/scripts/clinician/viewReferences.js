'use strict';

function deleteDoc(id) {
  const button = $('#delete' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '/api/userexercise/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('ReferenceExercise Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}

function editDoc(id) {

  let exerciseName = request.payload.exerciseName;
  console.log(findexerciseName());
  const url = 'api/userexercise/setting/' + exerciseName;
  const patientId = window.location.pathname.split('/').pop();
  $.get(url, function(data){

    window.location = 'userexercise/setting/' + exerciseName;

  });
}
