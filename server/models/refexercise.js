'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class RefExercise extends MongoModels {

  static create(userId, exerciseId, type, refferenceId, bodyFrames, callback) {

    const document = {
      bodyFrames,
      time: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }
}


RefExercise.collection = 'refexercises';


RefExercise.schema = Joi.object().keys({
  _id: Joi.object(),
  userId: Joi.string().required(),
  exerciseId: Joi.string().required(),
  //we can also define a boolean field as isRefference instead 
  type: Joi.string().valid('Reference','Practice').required(),
  refferenceId: Joi.string().required(),
  isActive: Joi.boolean().required(),
  bodyFrames: Joi.array().required(),
  createdAt: Joi.date().required()
});

//userId and exerciseId don't have to be part of payload because
//we can get userId of patient from request.auth.credentials and 
// we can also get exerciseId of the chosen exercise from window.location.pathname.split('/').pop() 
//because when the user chooses an exercise we can pass the exerciseId of the chosen exercise as part of the url, through a get request
RefExercise.payload = Joi.object().keys({
  bodyFrames: Joi.array().required()
});



RefExercise.indexes = [
  { key: { '_id': 1 } },
  { key: { userId: 1 } },
  { key: { exerciseId: 1 } }
];


module.exports = RefExercise;
