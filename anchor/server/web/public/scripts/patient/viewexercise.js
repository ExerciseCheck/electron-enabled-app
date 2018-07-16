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

Date.prototype.getWeekNumber = function(){
  var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};

function initializePractice(exerciseId, addressValue) {

  const values = {};
  const url = '/api/userexercise/loadreference/' + exerciseId + '/';
  values.exerciseId = exerciseId;
  values.weekStart = new Date().getWeekNumber();

  $.ajax({
    type: 'POST',
    url: '/api/userexercise/practice/',
    data: values,
    success: function (result) {
        successAlert('Starting new practice session!');
        $.get(url, function(data){
          console.log("GET from patient side");
          localStorage.setItem("refFrames", JSON.stringify(data));
          window.location = addressValue;
        });
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
  const checkPrac = '/api/userexercise/practice/' + exerciseId + '/';

  $.get(checkPrac, function(data) {
     if(data === false) {
       initializePractice(exerciseId, addressValue);
     }
  });
});
