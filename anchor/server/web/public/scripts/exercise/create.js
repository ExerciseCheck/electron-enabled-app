'use strict';

const schema = Joi.object({
  exerciseName: Joi.string().required(),
  description: Joi.string().required(),
  instructions: Joi.string().required()
});

joiToForm('formFields',schema);


// change click handler to read what user typed into instructions

$('#create').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });


  $.ajax({
    type: 'POST',
    url: '/api/exercise',
    data: values,
    success: function (result) {
      window.location = '/exercise'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
