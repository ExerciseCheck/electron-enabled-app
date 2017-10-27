'use strict';
const RefExercise = require('../../../server/models/refexercise');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');


lab.experiment('RefExercise Class Methods', () => {

  lab.before((done) => {

    RefExercise.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    RefExercise.deleteMany({}, (err, count) => {

      RefExercise.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    RefExercise.create(
      'bodyFrames',
      (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(RefExercise);

      done();
    });
  });


  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = RefExercise.insertOne;
    RefExercise.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    RefExercise.create(
      'bodyFrames',
      (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      RefExercise.insertOne = realInsertOne;

      done();
    });
  });
});
