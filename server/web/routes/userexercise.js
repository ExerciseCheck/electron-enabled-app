'use strict';
const internals = {};
const Async = require('async');
const Boom = require('boom');
const Config = require('../../../config');
const UserExercise = require('../../models/userExercise');
const Exercise = require('../../models/exercise');
const Async = require('async');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/userexercise',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('userexercise/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/create',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('userexercise/create', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/create/practice',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('userexercise/createpractice', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/start/{exerciseId}',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      /*Exercise.findById(request.params.exerciseId, (err, exercise) => {

        if (err) {
          return reply(err);
        }

        return reply.view('userexercise/start', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          exercise
        });
      });*/
      Async.auto({
        findNumSets: function (done) {

          const query = {
            userId: request.auth.credentials.user._id.toString(),
            exerciseId: request.params.exerciseId,
            type: 'Reference'
          };

          UserExercise.findOne(query, done);
        },
        findNumPractices:['findNumSets', function (results, done) {

          if (!results.findNumSets || results.findNumSets === undefined ) {
            return reply(Boom.notFound('Reference exercise not found'));
          }
          const query = {
            userId: request.auth.credentials.user._id.toString(),
            exerciseId: request.params.exerciseId,
            type: 'Practice'
          };

          UserExercise.find(query, done);
        }],
        findExercise:['findNumPractices', function (results, done) {

          Exercise.findById(request.params.exerciseId, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findExercise || results.findExercise === undefined) {
          return reply(Boom.notFound('exercise not found'));
        }
        return reply.view('userexercise/start', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          numSets: results.findNumSets.numRepetition,
          setNumber: results.findNumPractices.length + 1,
          exercise : results.findExercise
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/play/{exerciseId}',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      Exercise.findById(request.params.exerciseId, (err, exercise) => {

        if (err) {
          return reply(err);
        }

        return reply.view('userexercise/play', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          exercise
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/stop/{exerciseId}',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      Exercise.findById(request.params.exerciseId, (err, exercise) => {

        if (err) {
          return reply(err);
        }

        return reply.view('userexercise/stop', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          exercise
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/clinician/session/{patientId}/{exerciseId}',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      //this obejct will contains all the infomation about user exercise including numSession, numRepitition, if there exists a reference
      // we pass it to the template we are replying with 
      const userExerciseInfo = {};

      Async.auto({

        //first we query userExercise model to find the reference 
        findReference: function (done) {

          const query = {
            userId: request.params.patientId,
            exerciseId: request.params.exerciseId,
            type: 'Reference'
          };

          UserExercise.findOne(query, done);
        },
        updateUserExerciseInfo:['findReference', function (results, done) {

          //case where there is no reference 
          if ( !results.findReference ){

            userExerciseInfo.referenceExists = false;

          }

          //case where there is a reference, find number of practice exercises 
          else if ( results.findReference )  {
            userExerciseInfo.referenceExists = true;
            //by doing this we have access to all information including numSessions, numRepetitions
            userExerciseInfo.numSessions = results.findReference.numSessions;
          }

          //anyway we count the number of practice exercises for the patient 
          const pipeLine = [
            { '$match': { 'userId' : request.params.patientId, 'exerciseId': request.params.exerciseId, 'type': 'Practice' } },
            { '$group': {
              '_id': null,
              count: { $sum: 1 }
            }
            }
          ];

          UserExercise.aggregate(pipeLine, done);

        }],
        findExerciseName:['updateUserExerciseInfo', function (results, done) {

          Exercise.findById(request.params.exerciseId, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        //need this check to avoid error, if there is no practice exercise,results.updateUserExerciseInfo[0] will be undefined
        if ( results.updateUserExerciseInfo.length > 0 ) {
          userExerciseInfo.numPractices = results.updateUserExerciseInfo[0].count;
        }
        else {
          userExerciseInfo.numPractices = 0;
        }
        console.log(JSON.stringify(userExerciseInfo));
        userExerciseInfo.exerciseName = results.findExerciseName.exerciseName;
        return reply.view('userexercise/cliniciansession', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          userExerciseInfo

        });

      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/create/ref',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('userexercise/createref', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/{id}',
    config: {
      auth: {
        strategy: 'session',
        scope: ['root','admin']
      }
    },
    handler: function (request, reply) {

      UserExercise.findById(request.params.id, (err, document) => {

        if (err) {
          return reply(err);
        }

        return reply.view('userexercise/edit', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName')
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/viewexercises',
    config: {
      auth: {
        strategy: 'session'
        //scope: ['root','admin', 'patient']
      }
    },
    handler: function (request, reply) {

      Exercise.find({}, (err, exercises) => {

        if (err) {
          return reply(err);
        }

        return reply.view('userexercise/viewExercises', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          exercises
        });
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/refexercises/play/{id}',
    config: {
      // auth: {
      //   strategy: 'session',
      //   scope: ['root','admin']
      // }
    },
    handler: function (request, reply) {

      //noinspection JSAnnotator
      UserExercise.findOne({ 'auth.user._id':request.params.id }, (err, document) => {

        if (err) {
          return reply(err);
        }

        return reply.view('refexercises/play', {
          projectName: Config.get('/projectName'),
          frameData: JSON.stringify(document.bodyFrames)
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/play',
    config: {
      // auth: {
      //   strategy: 'session',
      //   scope: ['root','admin']
      // }
    },
    handler: function (request, reply) {

      //noinspection JSAnnotator
      UserExercise.findOne({}, (err, document) => {

        if (err) {
          return reply(err);
        }

        return reply.view('userexercises/play', {
          frameData: JSON.stringify(document.bodyFrames)
        });
      });
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'userexerciseList',
  dependencies: 'visionary'
};
