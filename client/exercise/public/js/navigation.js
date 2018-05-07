$(document).ready(function () {
  //state button
  $("#command").click(function () {
    if (clientActive){
      socket.emit('command');
      clientActive = false; // lock the client until server responds
    }
  });

  $("#gt").click(function () {
    socket.emit('dataLabelFromClient', 1);
  });

  $("#ex").click(function () {
    socket.emit('dataLabelFromClient', 2);
  });

  $("#re").click(function () {
    socket.emit('dataLabelFromClient', 3);
  });

  $("#report").click(function () {
    console.log('report button pressed!');
    location.href = "report.html";
    location.target = "_blank";
  });

});
//hide button
