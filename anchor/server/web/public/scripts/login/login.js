'use strict';

$('#login').click((event) => {

  event.preventDefault();
  const username = $("#username").val();
  const password = $("#password").val();
  const values = {};
  values.username = username;
  values.password = password;
  $.ajax({
    type: 'POST',
    url: 'api/login',
    data: values,
    success: function (result) {
      window.location = baseUrl;
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
