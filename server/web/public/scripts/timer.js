'use strict';

function startTimer() {
  var start = Date.now();
  var timer = setInterval(function() {
      var delta = Date.now() - start;
      var time = window.CONFIG.TIMER_MAX - Math.floor(delta / 1000);
      if (time <= 0) {
        clearInterval(timer);
        $("#num").text("");
        $("#start").text("Time to start!");
        $("#cover").css("display", "none");
        var event = new Event('timer-done');
        document.dispatchEvent(event);
      } else {
        $("#num").text(time);
      }
  }, 100);
}

$(document).ready(function(){
  startTimer();
});
