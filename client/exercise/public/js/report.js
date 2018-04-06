var socket = io.connect('/');

$(document).ready(function(){

    socket.emit('analyze');
    socket.on('report', function(chartData, barData, gtArray, exArray){

      console.log('report signal received!');
      var ctx = document.getElementById("barChart").getContext("2d");//save
      var config = barTemplateA(barData,gtArray,exArray);
      var myHorizontalBar = new Chart(ctx, config);

      var s = document.getElementById("slct1");
      addCheckbox(gtArray,exArray,s)
      JSON2table(chartData);

    }) //end of 'report' signal

    $("#lineChartshow").click(function () {
      $("#lineChartshow")[0].value="Update Curves";
      var MAXLIM = 100,gtInd = [], exInd = [];
      for(var i = 0; i<MAXLIM; i++){
        var gtLabel = "ch" + i.toString() + "gt";
        if (document.getElementById(gtLabel)!=null)
          if (document.getElementById(gtLabel).checked)
            gtInd.push(i);

        var exLabel = "ch" + i.toString() + "ex";
        if (document.getElementById(exLabel)!=null)
          if (document.getElementById(exLabel).checked)
            exInd.push(i);
      }

      var jt = document.getElementById("dropJoints").value;
      var datatype = document.getElementById("dropPos").value;
      socket.emit('curveRequest',gtInd,exInd,jt,datatype);
    });

    $("#savedata").click(function () {
      $("#savedata")[0].value="Data Saved!";
      socket.emit('saveRequest','output.xlsx');
    });

    socket.on('curveResult',function(curveData){
      var ctx = document.getElementById("lineChart").getContext("2d");
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      var config = lineTemplateA(curveData);
      var  myLine = new Chart(ctx, config);
      $("#div_line")[0].style="visibility: none";
    });
});
