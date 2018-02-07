'use strict';

function start(id) {
  const button = $('#startSession');
  const line1 = $('#line1');
  const line2 = $('#line2');
  const line3 = $('#line3');
  const discard = $('#discard')

  if (button.text() === 'START') {
    button.text('STOP');
    button.css({backgroundColor: 'red'});
    line1.text('To end the session,');
    line2.css({right: '95px'});
    line2.text('click stop');
  }

  else if (button.text() === 'STOP'){

    discard.css('visibility', 'visible');
    button.text('SAVE AS EXERCISE');
    button.css({backgroundColor: 'blue'});
    line1.text('Session ended.');
    line1.css({right: '55px'});
    line2.hide();
    line3.css('visibility', 'visible');
  }
}
