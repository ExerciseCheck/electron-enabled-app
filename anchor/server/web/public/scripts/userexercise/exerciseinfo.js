
$(document).ready(function() {

  //console.log(typeof refVideoLinks);
  // var encoded = encodeURI(refVideoLinks);
  // var decoded = decodeURIComponent(str.replace(/%2b/g, '%20'));
  // console.log(encoded)
  // console.log(decoded);
  arrayFromLinks = Array.prototype.slice.call(refVideoLinks);
  joinRefVideoLinks = arrayFromLinks.join("")
  console.log(typeof joinRefVideoLinks);

  // Gets the video src from the data-src on each button

  function createYouTubeEmbedLink (links) {
    // refVideoLinks = refVideoLinks.split(",");
    // var arrayLength = refVideoLinks.length;

    var links = joinRefVideoLinks.split();



    array = new Array();
    console.log(typeof array);


    // console.log(links.length);

    // loop
    for (i = 0; i <= links.length; i++) {
        array[i] = links[i].replace("watch?v=", "embed/");
        array.push(array[i]);

          }

    links = array;
    console.log(Array.isArray(array));

    //console.log(links)

    console.log(array);
    return array;
  }

  console.log(exerciseName);

  //console.log(refVideoLinks);
 console.log(createYouTubeEmbedLink(refVideoLinks))

    var $videoSrc;
    $('.video-btn').click(function() {
      $videoSrc = $(this).data( "src" );
    });

    // when the modal is opened, autoplay it
    $('#myModal').on('shown.bs.modal', function (e) {

      // set the video src to autoplay and not to show related video.
      $("#video").attr('src',$videoSrc + "?rel=0&amp;showinfo=0&amp;modestbranding=1&amp;autoplay=1" );
    })

    // stop playing the youtube video when closing the modal
    $('#myModal').on('hide.bs.modal', function (e) {
      // stop video
      $("#video").attr('src',$videoSrc);
    })

});



// squat: ["",]



// function goToSettings() {
//
//   window.location = '/exercise/setting' + exerciseId + '/' + patientId;
// }
