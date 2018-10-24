
$('.collapse').collapse('hide');

function filter(inputId, classSelector) {

  const  input = $(inputId);
  const filter = input.val().toUpperCase();

  $(classSelector).each(function() {

    if ($(this)[0].innerHTML.toUpperCase().indexOf(filter) > -1) {
      $(this).show();
    }
    else {
      $(this).hide();

    }
  })
}

function showPopUp(clinicianId, userAccess) {

  $("#clinicianId").val(clinicianId);

  //if items in the checkbox are already in the users array of the selected clinician
  //check them.
  $('.popupItems input[type=checkbox]').each(function (index, item) {
    $(item).prop('checked', false);
    if( userAccess.indexOf($(item).val()) > -1 ) {
      $(item).prop('checked', true);
    }
  });

  $("#popUp").show();
}

$('#clinicians').change(function() {

  const clinicianId = $('#clinicians').val();
  const url = '/api/clinicians/userAccess/' + clinicianId;
  const preSelected = [];

  $.get(url , function( data ) {

     $.each(data, function(i,e){

       preSelected.push(e);
     });
    $('#patients').val(preSelected).trigger("change");
  });

  $('#patients').select2({
    ajax: {
      delay: 250,
      url: 'api/select2/patients',
      dataType: 'json',
      processResults: function (data) {
        var results = [];
        for(var i = 0; i < data.results.length; i++) {
          results.push({
            id: data.results[i]._id,
            text: data.results[i].name
          })
        }
        data.results = results;
        return data;
      },
      cache: true
    },
    placeholder: 'Search for a user by name or email',
    minimumInputLength: 1
  });
});

function updatePatients(){

  console.log("here");
  const patients = $('#patients').val();
  const clinicianId = $('#clinicians').val();
  event.preventDefault();
  var values = {};
  //this is neccessary to pass the payload validation
  values.userAccess = JSON.stringify(patients);

  $.ajax({
    type: 'PUT',
    url: 'api/clinicians/userAccess/' + clinicianId,
    dataType: 'json',
    data:values,
    success: function (result) {
      successAlert(JSON.stringify(result.message));
      window.location = '/clinician';
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}



$(document).ready(function() {

  $('#patients').select2({
    ajax: {
      delay: 250,
      url: 'api/select2/patients',
      dataType: 'json',
      processResults: function (data) {
        var results = [];
        for(var i = 0; i < data.results.length; i++) {
          results.push({
            id: data.results[i]._id,
            text: data.results[i].name
          })
        }
        data.results = results;
        return data;
      },
      cache: true
    },
    placeholder: 'Search for a user by name or email',
    minimumInputLength: 1
  });

  $('#clinicians').select2({
    ajax: {
      delay: 250,
      url: 'api/select2/clinicians',
      dataType: 'json',
      processResults: function (data) {
        var results = [];
        for(var i = 0; i < data.results.length; i++) {
          results.push({
            id: data.results[i]._id,
            text: data.results[i].name
          })
        }
        data.results = results;
        return data;
      },
      cache: true
    },
    placeholder: 'Search for a user by name or email',
    minimumInputLength: 1,
  });
});

