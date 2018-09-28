'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class ReferenceExercise extends MongoModels {

  static create(userId, exerciseId, numSets, numRepetition, diffLevel, bodyFrames,
                neck2spineBase, shoulder2shoulder, refMin, refMax, refLowerJoint, refUpperJoint, refTime, callback){

    const document = {
      userId,
      exerciseId,
      numSets,
      numRepetition,
      diffLevel,
      isActive: true, //default value
      bodyFrames,
      neck2spineBase,
      shoulder2shoulder,
      refMin,
      refMax,
      refLowerJoint,
      refUpperJoint,
      refTime,
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

  diffLevel: Joi.number().min(0).max(1).required(),

  neck2spineBase: Joi.number().required(),
  shoulder2shoulder: Joi.number().required(),
  refMin: Joi.number().required(),
  refMax: Joi.number().required(),
  refLowerJoint: Joi.number().required(),
  refUpperJoint: Joi.number().required(),
  refTime: Joi.number().required(),

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
  diffLevel: Joi.number().min(0).max(1).required(),
});

// This is for validating new bodyFrames data and its associated parameters
ReferenceExercise.dataPayload = Joi.object().keys({
  bodyFrames: Joi.array().required(),
  neck2spineBase: Joi.number().required(),
  shoulder2shoulder: Joi.number().required(),
  refMin: Joi.number().required(),
  refMax: Joi.number().required(),
  refLowerJoint: Joi.number().required(),
  refUpperJoint: Joi.number().required(),
  refTime: Joi.number().required(),
});

//This is for validating reference settings update
ReferenceExercise.updatePayload = Joi.object().keys({
  //bodyFrames: Joi.array().required(),
  numSets: Joi.number().integer().required(),
  numRepetition: Joi.number().integer().required(),
  diffLevel: Joi.number().min(0).max(1).required(),
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
