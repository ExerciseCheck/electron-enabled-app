'use strict';

const schema = Joi.object({
  numSessions: Joi.number().integer().required()
});

joiToForm('formFields',schema);

$('#create').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  values.userId = $('#userId').val();
  values.exerciseId = $('#exerciseId').val();
  $.ajax({
    type: 'POST',
    url: '/api/userexercise/reference',
    data: values,
    success: function (result) {
      window.location = '/userexercise'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});

$(document).ready(function() {
   
    $('#exerciseId').select2({
    ajax: {
      delay: 250,
      url: '/api/select2/exercise',
      dataType: 'json',
      processResults: function (data) {
        var results = [];
        for(var i = 0; i < data.results.length; i++) {
          results.push({
            id: data.results[i]._id,
            text: data.results[i].exerciseName
          })
        }
        data.results = results;
        return data;
      },
      cache: true
    },
    placeholder: 'Search for a exercise by name',
    minimumInputLength: 1,
  });

  $('#userId').select2({
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
});


