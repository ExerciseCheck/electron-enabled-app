'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class PracticeExercise extends MongoModels {

  static create(userId, exerciseId, referenceId, weekStart, callback){

    const document = {
      userId,
      exerciseId,
      referenceId,
      numSetsCompleted: 0,
      numRepsCompleted: 0,
      weekStart,
      weekEnd: -1,
      sets: [], //[] of {date: 00, reps: [], bodyframes: []}
      //isActive is set to true by default
      isActive: true,
      //body frames now go into sets
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

PracticeExercise.collection = 'practiceExercise';

PracticeExercise.schema = Joi.object().keys({
  _id: Joi.object(),
  userId: Joi.string().required(),
  exerciseId: Joi.string().required(),
  referenceId:  Joi.string().required(),
  //we can also define a boolean field as isReference instead
  numSetsCompleted: Joi.number().integer().required(),
  numRepsCompleted: Joi.number().integer().required(),
  weekStart: Joi.number().required(),
  weekEnd: Joi.number().required(),
  sets: Joi.array().required(), //make it more specific later
  isActive: Joi.boolean().required(),
  createdAt: Joi.date().required()
});

//this is used for validating payload of post requests when creating a NEW practice exercise
PracticeExercise.practicePayload = Joi.object().keys({
  exerciseId: Joi.string().required(),
  weekStart: Joi.number().required(),
});

//this is used for validating payload of put requests when updating a practice
PracticeExercise.dataPayload = Joi.object().keys({
  //bodyFrames: Joi.array().required(),
  numSetsCompleted: Joi.number().integer().required(),
  numRepsCompleted: Joi.number().integer().required(),
  //not sure how to validate updating an item inside sets
});

PracticeExercise.activatePayload = Joi.object().keys({
  isActive: Joi.boolean().required()
});

PracticeExercise.indexes = [
  { key: { '_id': 1 } },
  { key: { userId: 1 } },
  { key: { exerciseId: 1 } }
];


module.exports = PracticeExercise;
