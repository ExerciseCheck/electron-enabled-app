'use strict';

const schema = Joi.object({
  numSets: Joi.number().integer().required(),
  numRepetition: Joi.number().integer().required()
  // rangeScale: Joi.number().min(0).max(1).required(),
  // topThresh: Joi.number().min(0).max(1).required(),
  // bottomThresh: Joi.number().min(0).max(1).required(),
});

joiToForm('formFields',schema);

$('#update').click((event) => {
  const userExerciseId = window.location.pathname.split('/').pop();
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  $.ajax({
    type: 'PUT',
    url: '/api/userexercise/reference/' + userExerciseId,
    data: values,
    success: function (result) {
      window.location = '/userexercise'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
