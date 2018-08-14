'use strict';

const schema = Joi.object({
  exerciseName: Joi.string().required(),
  description: Joi.string().required(),
});



joiToForm('formFields',schema);

$('#create').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });

  values.joint = $('#impJoint').val();
  values.axis = $('#impAxis').val();
  values.direction = $('#direction').val();
  values.refLowerJoint = $('#refLowerJoint').val();
  values.refUpperJoint = $('#refUpperJoint').val();

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
