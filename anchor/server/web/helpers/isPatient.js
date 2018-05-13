'use strict';

module.exports = function isPatient(user) {

  const roles = user.roles;
  return (roles.admin || roles.root || roles.analyst || roles.researcher || roles.clinician) ? false : true;

};
