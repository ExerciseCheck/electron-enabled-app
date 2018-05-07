'use strict';
const Generate = {
  Template: {
    name: 'Template',
    pluralName: 'Templates',
    schema: 'Joi.object({\n' +
      '  _id: Joi.object(),\n' +
      '  name: Joi.string().required(),\n' +
      '  userId: Joi.boolean().required(),\n' +
      '  time: Joi.date().required()\n' +
    '});',
    payload: 'Joi.object({\n' +
    '  name: Joi.string().required()\n' +
    '});',
    defaultValues: {
      time: 'new Date()'
    },
    indexes: '[\n' +
    '  { key: { name: 1 } },\n' +
    '  { key: { userId: 1 } }\n' +
    '];',
    user: true,
    exampleCreate: [
      'name',
      'userId'
    ],
    tableVars: 'user.username user.name user.studyID name',
    tableFields: 'username name name time studyID userId',
    tableHeaders: ['Username', 'Name', 'Study ID','Template Name'],
    searchField: 'name',
    joiFormValue: [
      'joiFormValue(\'name\', \'{{document.name}}\');'
    ]
  },
  RefExercise: {
    name: 'RefExercise',
    pluralName: 'RefExercises',
    schema: 'Joi.object().keys({\n' +
    '  _id: Joi.object(),\n' +
    '  bodyFrames: Joi.array().required(),\n' +
    '  time: Joi.date().required()\n' +
    '});',
    payload: 'Joi.object().keys({\n' +
    '  bodyFrames: Joi.array().required()\n' +
    '});',
    defaultValues: {
      time: 'new Date()'
    },
    indexes: '[];',
    user: false,
    exampleCreate: [
      'bodyFrames'
    ],
    tableVars: 'bodyFrames',
    tableFields: 'bodyFrames',
    tableHeaders: ['BodyFrames'],
    searchField: 'bodyFrames',
    joiFormValue: [
      'joiFormValue(\'bodyFrames\', \'{{document.bodyFrames}}\');'
    ]
  }
};

module.exports = Generate;
