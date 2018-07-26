'use strict';
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d$@$!%*?&]{8,}/, '1 Uppercase, 1 lowercase, 1 number'),
  confirmPassword: Joi.string().required().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d$@$!%*?&]{8,}/, '1 Uppercase, 1 lowercase, 1 number')
});
joiToForm('formFields',schema);

$('#setup').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  delete values.confirmPassword;

  $.ajax({
    type: 'POST',
    url: '/setup',
    data: values,
    success: function (result) {
      values.username = values.email;
      delete values.email;
      $.ajax({
        type: 'POST',
        url: '/api/login',
        data: values,
        success: function (result) {
          window.location.reload();
        }
      });
    },
    error: function (result) {
      console.log(result);
      errorAlert(result.responseJSON.message);
    }
  });
});
