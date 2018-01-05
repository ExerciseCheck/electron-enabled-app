'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class RefExercise extends MongoModels {

  static create(bodyFrames, callback) {

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
  bodyFrames: Joi.array().required(),
  time: Joi.date().required()
});

RefExercise.payload = Joi.object().keys({
  bodyFrames: Joi.array().required()
});



RefExercise.indexes = [
  { key: { '_id': 1 } }
];


module.exports = RefExercise;
