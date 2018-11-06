'use strict';

const schema = Joi.object().keys({
  bodyFrames: Joi.string().required()
});
joiToForm('formFields',schema);

$('#create').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  $.ajax({
    type: 'POST',
    url: 'api/refexercises',
    data: values,
    success: function (result) {
      window.location = 'refexercises'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
