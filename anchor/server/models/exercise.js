'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class Exercise extends MongoModels {

  static create(exerciseName, description, userId, callback) {

    const document = {
      exerciseName,
      description,
      userId,
      joint,
      axis,
      direction,
      ref_lower_joint,
      ref_upper_joint,
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


Exercise.collection = 'refexercises';


Exercise.schema = Joi.object().keys({
  _id: Joi.object(),
  exerciseName: Joi.string().required(),
  description: Joi.string().required(),
  //this is the userId of the person creating the exercise
  userId: Joi.string().required(),
  joint: Joi.string().required(),
  axis: Joi.string().required(),
  direction: Joi.string().required(),
  ref_lower_joint: Joi.string().required(),
  ref_upper_joint: Joi.string().required(),
  createdAt: Joi.date().required()
});

Exercise.payload = Joi.object().keys({
  exerciseName: Joi.string().required(),
  description: Joi.string().required()
});



Exercise.indexes = [
  { key: { '_id': 1 } },
  { key: { userId: 1 } }
];

module.exports = Exercise;
