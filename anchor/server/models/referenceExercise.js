'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class ReferenceExercise extends MongoModels {

  static create(userId, exerciseId, numSets, numRepetition, rangeScale, topThresh, bottomThresh, bodyFrames, callback){

    const document = {
      userId,
      exerciseId,
      numSets,
      numRepetition,
      rangeScale,
      topThresh,
      bottomThresh,
      isActive: true, //default value
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


ReferenceExercise.collection = 'referenceExercise';


ReferenceExercise.schema = Joi.object().keys({
  _id: Joi.object(),
  userId: Joi.string().required(),
  exerciseId: Joi.string().required(),
  numSets: Joi.number().integer().required(),
  numRepetition: Joi.number().integer().required(),

  rangeScale: Joi.number().min(0).max(1).required(),
  topThresh: Joi.number().min(0).max(1).required(),
  bottomThresh: Joi.number().min(0).max(1).required(),

  isActive: Joi.boolean().required(),
  bodyFrames: Joi.array().required(),
  createdAt: Joi.date().required()
});
//this is used for validating payload of post requests when creating reference exercise
ReferenceExercise.referencePayload = Joi.object().keys({
  //bodyFrames: Joi.array().required(),
  userId: Joi.string().required(),
  exerciseId: Joi.string().required(),
  numSets: Joi.number().integer().required(),
  numRepetition: Joi.number().integer().required(),
  rangeScale: Joi.number().min(0).max(1).required(),
  topThresh: Joi.number().min(0).max(1).required(),
  bottomThresh: Joi.number().min(0).max(1).required()
});

ReferenceExercise.dataPayload = Joi.object().keys({
  bodyFrames: Joi.array().required()
});

//this is used for validating payload of put requests when updating a reference exercise
ReferenceExercise.updatePayload = Joi.object().keys({
  //bodyFrames: Joi.array().required(),
  numSets: Joi.number().integer().required(),
  numRepetition: Joi.number().integer().required(),
  rangeScale: Joi.number().min(0).max(1).required(),
  topThresh: Joi.number().min(0).max(1).required(),
  bottomThresh: Joi.number().min(0).max(1).required()
});

ReferenceExercise.activatePayload = Joi.object().keys({
  isActive: Joi.boolean().required()
});

ReferenceExercise.indexes = [
  { key: { '_id': 1 } },
  { key: { userId: 1 } },
  { key: { exerciseId: 1 } }
];


module.exports = ReferenceExercise;
