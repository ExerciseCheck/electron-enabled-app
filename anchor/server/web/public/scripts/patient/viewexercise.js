'use strict';

function filter() {

  const  input = $("#search");
  const filter = input.val().toUpperCase();

  $("ul .listButtons").each(function() {
    if ($(this)[0].innerHTML.toUpperCase().indexOf(filter) > -1) {
      $(this).show();
    }
    else {
      $(this).hide();

    }
  })
}


function initializePractice(exerciseId) {

  const values = {};
  values.exerciseId = exerciseId;
  values.weekStart = 50;
  $.ajax({
    type: 'POST',
    url: '/api/userexercise/practice/',
    data: values,
    success: function (result) {
        successAlert('Practice successfully updated');
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

$(".listButtons a").click(function() {

  event.preventDefault();
  const addressValue = $(this).attr("href");
  const addressToArray = addressValue.split('/');
  const exerciseId = addressToArray[5];
  const url = '/api/userexercise/loadreference/' + exerciseId + '/';
  const checkPrac = '/api/userexercise/practice/' + exerciseId + '/';

  $.get(checkPrac, function(data) {
     if(!data.practiceExists) {
       alert("Nooo");
       initializePractice(exerciseId);
     }
  });

  $.get(url, function(data){
    console.log("GET from patient side");
    localStorage.setItem("refFrames", JSON.stringify(data));
    window.location = addressValue;
  });
});
