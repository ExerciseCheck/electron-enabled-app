'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class Exercise extends MongoModels {

<<<<<<< HEAD
  static create(exerciseName, description, instructions, userId, callback) {
=======
  static create(exerciseName, description, joint, axis, direction, refLowerJoint, refUpperJoint, userId, callback) {
>>>>>>> f83f0834c8c0da20144507947c7248333396d99a

    const document = {
      exerciseName,
      description,
<<<<<<< HEAD
      instructions,
      userId,
=======
      joint,
      axis,
      direction,
      refLowerJoint,
      refUpperJoint,
>>>>>>> f83f0834c8c0da20144507947c7248333396d99a
      createdAt: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }
}

Exercise.collection = 'exercises';

Exercise.schema = Joi.object().keys({
  _id: Joi.object(),
  exerciseName: Joi.string().required(),
  description: Joi.string().required(),
<<<<<<< HEAD
  instructions: Joi.array().items(Joi.string().required()),
  //this is the userId of the person creating the exersice
  userId: Joi.string().required(),
=======
  joint: Joi.number().integer().required(),
  axis: Joi.string().required(),
  direction: Joi.string().required(),
  refLowerJoint: Joi.number().integer().required(),
  refUpperJoint: Joi.number().integer().required(),
>>>>>>> f83f0834c8c0da20144507947c7248333396d99a
  createdAt: Joi.date().required()
});

Exercise.payload = Joi.object().keys({
  exerciseName: Joi.string().required(),
  description: Joi.string().required(),
<<<<<<< HEAD
  instructions: Joi.array().items(Joi.string().required())

=======
  joint: Joi.number().integer().required(),
  axis: Joi.string().valid('depthX','depthY').required(),
  direction: Joi.string().valid('up','down','L2R','R2L').required(),
  refLowerJoint: Joi.number().integer().required(),
  refUpperJoint: Joi.number().integer().required()
>>>>>>> f83f0834c8c0da20144507947c7248333396d99a
});



Exercise.indexes = [
  { key: { '_id': 1 } },
  { key: { userId: 1 } }
];

module.exports = Exercise;
