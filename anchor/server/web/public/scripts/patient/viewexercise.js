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


$(".listButtons a").click(function() {

  event.preventDefault();
  const addressValue = $(this).attr("href");
  const addressToArray = addressValue.split('/');
  const exerciseId = addressToArray[5];
  const url = '/api/userexercise/loadreference/' + exerciseId + '/';
  $.get(url, function(data){
    console.log("GET from patient side");
    localStorage.setItem("refFrames", JSON.stringify(data));
    window.location = addressValue;
  });
});
