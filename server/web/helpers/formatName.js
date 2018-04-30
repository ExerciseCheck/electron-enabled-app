'use strict';

module.exports = function formatName(name) {

  const capitalizeFirstLetter = function (string) {

    const formattedName = [];

    //capitalize first letter only
    formattedName.push(string[0].toUpperCase());
    for (let i = 1; i < string.length; ++i) {
      formattedName.push(string[i].toLowerCase());
    }

    return formattedName.join('');
  };

  const splitedBySpace = name.split(' ');

  for (let i = 0; i < splitedBySpace.length; ++i){
    splitedBySpace[i] = capitalizeFirstLetter(splitedBySpace[i]);
  }

  return splitedBySpace.join(' ');
};
