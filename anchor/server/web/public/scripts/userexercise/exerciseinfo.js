$(document).ready(function() {

// Gets the video src from the data-src on each button

console.log("hello");

var $videoSrc;
$('.video-btn').click(function() {
    $videoSrc = $(this).data( "src" );
});
console.log($videoSrc);



// when the modal is opened, autoplay it
$('#myModal').on('shown.bs.modal', function (e) {

// set the video src to autoplay and not to show related video.
$("#video").attr('src',$videoSrc + "?rel=0&amp;showinfo=0&amp;modestbranding=1&amp;autoplay=1" );
})


// stop playing the youtube video when I close the modal
$('#myModal').on('hide.bs.modal', function (e) {
    // stop video
    $("#video").attr('src',$videoSrc);
})

});

// function goToSettings() {
//
//   window.location = '/exercise/setting' + exerciseId + '/' + patientId;
// }
