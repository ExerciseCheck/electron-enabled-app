'use strict';
const signUpSchema = Joi.object({
  name: Joi.string().required(),
  username: Joi.string().lowercase().invalid('root').required(),
  email: Joi.string().email().required(),
  password: Joi.string().required().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{6,}/, "Minimum 6 characters, at least one uppercase letter, one lowercase letter, one number and one special character"),
  confirmPassword: Joi.string().required()
});
joiToForm('signUpFormFields',signUpSchema);

$('#signup').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#signupForm').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  if(values['password'] === values['confirmPassword']) {
    delete values['confirmPassword'];
    $.ajax({
      type: 'POST',
      url: '/api/signup',
      data: values,
      success: function (result) {
        window.location = '/';
      },
      error: function (result) {
        alert("oye")
        errorAlert(result.responseJSON.message);
      }
    });
  } else {
    errorAlert('Passwords do not match');
  }
});
