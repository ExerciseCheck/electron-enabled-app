'use strict';

function deleteDoc(id) {
  const button = $('#delete' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '../api/userexercise/' + id,
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
