'use strict';
var req, db;

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
          openDB(function() {
            let refEntry = {type: 'refFrames', body: data};
            let bodyFramesStore = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames');
            let req = bodyFramesStore.put(refEntry);
            req.onsuccess = function(e) {
              window.location = addressValue;
            };
          });
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
    initializePractice(exerciseId, addressValue);

  });
});
