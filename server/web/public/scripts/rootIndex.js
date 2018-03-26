 
/*$('.changeMembersBtn').each(function(index, item) {
  console.log($(item));   
  $(item).find("button").on("mouseover", function() {
    console.log("here");
    $(item).find("button").show();
  })    
});

$('.changeMembersBtn').mouseout(function(event)
{
   $(this).find('button').hide();
});*/


/*function filter() {
  const  input = $("#search");
  const filter = input.val().toUpperCase();

  $(".list-group-item").each(function() {
    if ($(this)[0].innerHTML.toUpperCase().indexOf(filter) > -1) {
      $(this).show();
    }
    else {
      $(this).hide();
             
    }
  })
}*/

function filter(inputId, classSelector) {

  const  input = $(inputId);
  const filter = input.val().toUpperCase();

  $(classSelector).each(function() {
     
    if ($(this)[0].innerHTML.toUpperCase().indexOf(filter) > -1) {
      $(this).show();
    }
    else {
      $(this).hide();
             
    }
  })
}

function showPopUp(clinicianId, userAccess) {
   
  $("#clinicianId").val(clinicianId);
   
  //if items in the checkbox are already in the users array of the selected clinician
  //check them.
  $('.popupItems input[type=checkbox]').each(function (index, item) {
    if( userAccess.indexOf($(item).val()) > -1 ) {
      $(item).prop('checked', true);
    }              
  });
  
  $("#popUp").show();
}

