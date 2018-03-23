'use strict';

module.exports = function formatName(name) {

  const formattedName = [];
  let i = 0;
  //capitalize first letter only
  formattedName.push(name[0].toUpperCase());

  for (i = 1; i < name.length; ++i) {
    formattedName.push(name[i].toLowerCase());
  }

  return formattedName.join('');
};
