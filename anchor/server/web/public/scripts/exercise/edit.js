'use strict';

const schema = Joi.object({
  exerciseName: Joi.string().required(),
  description: Joi.string().required(),
  instructions: Joi.string().required(),
  refVideoLinks: Joi.string().required(),
  joint: Joi.number().integer().required(),
  axis: Joi.string().required(),
  direction: Joi.string().required(),
  refLowerJoint: Joi.number().integer().required(),
  refUpperJoint: Joi.number().integer().required(),
});

joiToForm('formFields',schema);

$('#update').click((event) => {
  const exerciseId = window.location.pathname.split('/').pop();
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  $.ajax({
    type: 'PUT',
    url: '/api/exercise/' + exerciseId,
    data: values,
    success: function (result) {
      window.location = '/exercise'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
