'use strict';

const Moment = require('moment');

module.exports = function format(date) {

  return Moment(date).format('L');
};
