function hidePopUp(){

 $("#popUp").hide();

}

function update(){

  const clinicianId = $("#clinicianId").val();
  event.preventDefault();
  var values = {};
  var checkedPatients = [];
  //get the value of the checked checkboxes and store them in an array
  $('.popupItems input[type=checkbox]:checked').each(function (index, item) {
    checkedPatients.push($(item).val());

  });
  //this is neccessary to pass the payload validation
  values.userAccess = JSON.stringify(checkedPatients);

  $.ajax({
    type: 'PUT',
    url: 'api/clinicians/userAccess/' + clinicianId,
    dataType: 'json',
    data:values,
    success: function (result) {
      successAlert(JSON.stringify(result.message));
      window.location = 'clinician';
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}


