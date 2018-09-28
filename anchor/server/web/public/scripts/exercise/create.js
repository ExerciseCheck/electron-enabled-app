'use strict';

const schema = Joi.object({
  exerciseName: Joi.string().required(),
  description: Joi.string().required(),
<<<<<<< HEAD
  instructions: Joi.string().required()
=======
>>>>>>> f83f0834c8c0da20144507947c7248333396d99a
});



joiToForm('formFields',schema);


// change click handler to read what user typed into instructions

$('#create').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });

<<<<<<< HEAD
=======
  values.joint = $('#impJoint').val();
  values.axis = $('#impAxis').val();
  values.direction = $('#direction').val();
  values.refLowerJoint = $('#refLowerJoint').val();
  values.refUpperJoint = $('#refUpperJoint').val();
>>>>>>> f83f0834c8c0da20144507947c7248333396d99a

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
