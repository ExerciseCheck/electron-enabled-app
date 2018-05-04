'use strict';


module.exports = function compare(lvalue, operator, rvalue, options) {

  if (arguments.length < 3) {
    throw new Error('Handlerbars Helper \'compare\' needs 2 parameters');
  }

  if (options === undefined) {
    options = rvalue;
    rvalue = operator;
    operator = '===';
  }

  const operators = {
    /*'==': function (l, r) {
      return l == r;
    },*/
    '===': function (l, r) {

      return l === r;
    },
    /*'!=': function (l, r) {
      return l != r;
    },*/
    '!==': function (l, r) {

      return l !== r;
    },
    '<': function (l, r) {

      return l < r;
    },
    '>': function (l, r) {

      return l > r;
    },
    '<=': function (l, r) {

      return l <= r;
    },
    '>=': function (l, r) {

      return l >= r;
    },
    'typeof': function (l, r) {

      return typeof l === r;
    }
  };

  if (!operators[operator]) {
    throw new Error('Handlerbars Helper \'compare\' doesn\'t know the operator ' + operator);
  }

  const result = operators[operator](lvalue, rvalue);

  if (result) {
    return options.fn(this);
  }
  return options.inverse(this);

};



