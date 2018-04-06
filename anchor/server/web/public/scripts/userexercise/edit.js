'use strict';

const schema = Joi.object().keys({
  bodyFrames: Joi.array().required()
});
joiToForm('formFields',schema);

$('#update').click((event) => {
  const documentID = window.location.pathname.split('/').pop();
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  $.ajax({
    type: 'PUT',
    url: '../api/refexercises/' + documentID,
    data: values,
    success: function (result) {
      window.location = '../refexercises'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
