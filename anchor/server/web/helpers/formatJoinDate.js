'use strict';

module.exports = function formatJoinDate(timeCreated) {

  const date = new Date(timeCreated);
  return date.toDateString() + ' at ' +
         date.toLocaleTimeString('en-us');
};
