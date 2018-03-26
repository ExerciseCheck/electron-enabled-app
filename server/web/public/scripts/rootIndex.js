
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
    if( userAccess.indexOf($(item).val()) > -1 ) {
      $(item).prop('checked', true);
    }              
  });
  
  $("#popUp").show();
}

function submitClinician() {
   
  const clinicianId = $('#clinicians').val();
  const url = '/api/clinicians/userAccess/' + clinicianId;
  $.get(url , function( data ) {
     $.each(data, function(i,e){
       console.log(e);
       $("#patients option[value='" + e + "']").prop("selected", true);
     })
  });
}

$(document).ready(function() {
  $('#patients').select2({
    ajax: {
      delay: 250,
      url: '/api/select2/users',
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

  $('#clinicians').select2({
    ajax: {
      delay: 250,
      url: '/api/select2/clinicians',
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

