'use strict';
const internals = {};
const Async = require('async');
const Boom = require('boom');
const Config = require('../../../config');
const UserExercise = require('../../models/userExercise');
const Exercise = require('../../models/exercise');
const User = require('../../models/user');
const Info = require('./exerciseInfo.json');

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
    path: '/userexercise/reference/{userId}',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      User.findById(request.params.userId, (err, user) => {

        if (err) {
          return reply(err);
        }

        return reply.view('clinician/viewReferences', {
          patientName: user.name,
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName')
        });
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
    path: '/userexercise/session/{mode}/{type}/{exerciseId}/{patientId?}',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      if (request.params.mode !== 'start' && request.params.mode !== 'play' && request.params.mode !== 'stop') {
        return reply(Boom.notFound('Invalid Mode'));
      }

      if (request.params.type !== 'practice' && request.params.type !== 'reference') {
        return reply(Boom.notFound('Invalid Type'));
      }

      let patientId = '';
      //logged-in user is clinician
      if (request.params.patientId ) {
        patientId = request.params.patientId;
      }
      //logged-in user is patient
      else {
        patientId = request.auth.credentials.user._id.toString();
      }
      let isComplete = false;
      let setNumber = 0;

      Async.auto({
        findReference: function (done) {

          //we dont't need to find the reference if we want to have a reference session
          if ( request.params.type === 'reference') {
            return done();
          }
          const filter = {
            userId: patientId,
            exerciseId: request.params.exerciseId,
            type:'Reference'
          };

          const pipeLine = [
            { '$match': filter },
            { '$sort': { createdAt: -1 } },
            { '$limit': 1 }
          ];
          UserExercise.aggregate(pipeLine, done);
        },
        findNumPractices:['findReference', function (results, done) {

          if ( request.params.type === 'reference') {
            return done();
          }
          if (!results.findReference[0] || results.findReference[0] === undefined ) {
            return reply(Boom.notFound('Reference exercise not found'));
          }

          const query = {
            userId: patientId,
            exerciseId: request.params.exerciseId,
            referenceId: results.findReference[0]._id.toString(),
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
        if (request.params.type === 'practice') {
          if ( results.findNumPractices.length === results.findReference[0].numSessions ) {
            isComplete = true;
          }
          if ( isComplete ) {
            setNumber = results.findNumPractices.length;
          }
          else if ( !isComplete )  {
            setNumber = results.findNumPractices.length + 1;
          }
        }

        if ( request.params.type === 'reference' ) {
          return reply.view('userexercise/session', {
            user: request.auth.credentials.user,
            projectName: Config.get('/projectName'),
            exercise : results.findExercise,
            mode: request.params.mode,
            type: request.params.type
          });
        }
        return reply.view('userexercise/session', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          numRepetition: results.findReference[0].numRepetition,
          numSets: results.findReference[0].numSessions,
          setNumber,
          exercise : results.findExercise,
          mode: request.params.mode,
          type: request.params.type,
          isComplete
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/setting/{exerciseId}/{patientId}',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      let referenceExists = true;
      let defaultNumReps = 1;
      let defaultNumSets = 1;

      Async.auto({

        findReference: function (done) {

          const filter = {
            userId: request.params.patientId,
            exerciseId: request.params.exerciseId,
            type:'Reference'
          };

          const pipeLine = [
            { '$match': filter },
            { '$sort': { createdAt: -1 } },
            { '$limit': 1 }
          ];

          UserExercise.aggregate(pipeLine, done);

        },
        findPatientName:['findReference', function (results, done) {

          User.findById(request.params.patientId, done);
        }],
        findExerciseName:['findPatientName', function (results, done) {

          Exercise.findById(request.params.exerciseId, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findExerciseName || results.findExerciseName === undefined ) {
          return reply(Boom.notFound('Exercise not found'));
        }

        if (!results.findPatientName || results.findPatientName === undefined ) {
          return reply(Boom.notFound('Patient not found'));
        }
        //even if there is document in userExercise collection with empty body frames
        if ( results.findReference.length === 0 ) {
          referenceExists = false;
        }

        else if ( results.findReference.length !== 0 ) {

          // even if there is a document, but there's no body frames in it
          if ( results.findReference[0].bodyFrames.length === 0 ) {
            referenceExists = false;
          }

          if ( results.findReference[0].numRepetition ) {
            defaultNumReps = results.findReference[0].numRepetition;
          }

          if ( results.findReference[0].numSessions ) {
            defaultNumSets = results.findReference[0].numSessions;
          }
        }

        console.log(exerciseId);
        console.log(patientId);
        return reply.view('userexercise/setting', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          exerciseName : results.findExerciseName.exerciseName,
          patientName : results.findPatientName.name,
          exerciseId : request.params.exerciseId,
          patientId: request.params.patientId,
          referenceExists,
          defaultNumReps,
          defaultNumSets
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/play/{exerciseId}/{numSets}/{numRepetition}/{setNumber}',
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
          numRepetition: request.params.numRepetition,
          numSets: request.params.numSets,
          setNumber: request.params.setNumber,
          exercise
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/userexercise/stop/{exerciseId}/{numSets}/{numRepetition}/{setNumber}',
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
          numRepetition: request.params.numRepetition,
          numSets: request.params.numSets,
          setNumber: request.params.setNumber,
          exercise
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

      UserExercise.findById(request.params.id, (err, userExercise) => {

        if (err) {
          return reply(err);
        }
        return reply.view('userexercise/edit', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          userExercise
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

  server.route({
    method: 'GET',
    path: '/userexercise/info/{ExerciseName}',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      //console.log("trying to find patient id and exercise id")
      console.log(request.params)
      let exerciseName = request.params.exerciseName;
      return reply.view('userexercise/info', {
        user: request.auth.credentials.user,
        exerciseName: exerciseName,
        projectName: Config.get('/projectName'),
        title: exerciseName + ' Information',
      //  instructions: Info[exerciseName]['Instructions'],
        goal: Info[exerciseName]['Goal']

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
