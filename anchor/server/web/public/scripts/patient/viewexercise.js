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
