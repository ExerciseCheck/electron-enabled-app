'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class UserExercise extends MongoModels {

  static create(userId, exerciseId, referenceId, type, numSessions, numRepetition, bodyFrames, callback){

    const document = {
      userId,
      exerciseId,
      referenceId,
      type,
      numSessions,
      numRepetition,
      //isActive is set to true by default
      isActive: true,
      bodyFrames,
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


UserExercise.collection = 'userExercise';


UserExercise.schema = Joi.object().keys({
  _id: Joi.object(),
  userId: Joi.string().required(),
  exerciseId: Joi.string().required(),
  referenceId:  Joi.string().required(),
  //we can also define a boolean field as isReference instead
  type: Joi.string().valid('Reference','Practice').required(),
  numSessions: Joi.number().integer().required(),
  numRepetition: Joi.number().integer().required(),
  isActive: Joi.boolean().required(),
  bodyFrames: Joi.array().items(Joi.array().items(Joi.object())).required(),
  createdAt: Joi.date().required()
});

//this is used for validating payload of post requests when creating practice exercise
UserExercise.practicePayload = Joi.object().keys({
  //bodyFrames: Joi.array().required(),
  userId: Joi.string().required(),
  exerciseId: Joi.string().required()
});

//this is used for validating payload of post requests when creating reference exercise
UserExercise.referencePayload = Joi.object().keys({
  //bodyFrames: Joi.array().required(),
  numSessions: Joi.number().integer().required(),
  numRepetition: Joi.number().integer().required(),
  userId: Joi.string().required(),
  exerciseId: Joi.string().required()
});

//this is used for validating payload of put requests when updating a reference exercise
UserExercise.updatePayload = Joi.object().keys({
  //bodyFrames: Joi.array().required(),
  numSessions: Joi.number().integer().required(),
  numRepetition: Joi.number().integer().required()
});

UserExercise.activatePayload = Joi.object().keys({
  isActive: Joi.boolean().required()
});

UserExercise.indexes = [
  { key: { '_id': 1 } },
  { key: { userId: 1 } },
  { key: { exerciseId: 1 } }
];


module.exports = UserExercise;

