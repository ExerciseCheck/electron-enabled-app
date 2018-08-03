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

  values.joint = 0;
  values.axis = $('#impAxis').val();
  values.direction = $('#direction').val();
  values.refLowerJoint = $('#jointList context2').val();
  values.refUpperJoint = $('#jointList').context(3).val();

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
