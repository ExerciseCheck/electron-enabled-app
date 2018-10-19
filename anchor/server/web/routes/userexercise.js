'use strict';
const internals = {};
const Async = require('async');
const Boom = require('boom');
const Config = require('../../../config');
const PracticeExercise = require('../../models/practiceExercise');
const ReferenceExercise = require('../../models/referenceExercise');
const Exercise = require('../../models/exercise');
const User = require('../../models/user');
const Smoothing = require('../helpers/smoothingMethod');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/refexercise',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('userexercise/viewreference', {
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

      if (request.params.mode !== 'start' && request.params.mode !== 'play' && request.params.mode !== 'stop' && request.params.mode !== 'end') {
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
          };

          const pipeLine = [
            { '$match': filter },
            { '$sort': { createdAt: -1 } },
            { '$limit': 1 }
          ];
          ReferenceExercise.aggregate(pipeLine, done);
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
          };

          PracticeExercise.find(query, {sort: {$natural: -1}}, done);
        }],
        findExercise:['findNumPractices', function (results, done) {

          Exercise.findById(request.params.exerciseId, done);
        }],

      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findExercise) {
          return reply(Boom.notFound('exercise not found'));
        }
        if (request.params.type === 'practice') {
          results.findNumPractices[0].isComplete ?
            setNumber = results.findNumPractices[0].numSetsCompleted :
            setNumber = results.findNumPractices[0].numSetsCompleted + 1;
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
          numSets: results.findReference[0].numSets,
          setNumber,
          exercise : results.findExercise,
          mode: request.params.mode,
          type: request.params.type,
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
      let defaultDiffLevel = 0.75;

      Async.auto({

        findReference: function (done) {

          const filter = {
            userId: request.params.patientId,
            exerciseId: request.params.exerciseId,
          };

          const pipeLine = [
            { '$match': filter },
            { '$sort': { createdAt: -1 } },
            { '$limit': 1 }
          ];

          ReferenceExercise.aggregate(pipeLine, done);

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

          if ( results.findReference[0].numSets ) {
            defaultNumSets = results.findReference[0].numSets;
          }

          if ( results.findReference[0].diffLevel ) {
            defaultDiffLevel = results.findReference[0].diffLevel;
          }
        }

        return reply.view('userexercise/setting', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          exerciseName : results.findExerciseName.exerciseName,
          patientName : results.findPatientName.name,
          exerciseId : request.params.exerciseId,
          patientId: request.params.patientId,
          referenceExists,
          defaultNumReps,
          defaultNumSets,
          defaultDiffLevel
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

  // for smoothing test
  server.route({
    method: 'GET',
    path: '/userexercise/smoothing/{exerciseId}/{patientId?}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
      }
    },
    handler: function (request, reply) {

      let smoothingResult = {};
      let patientId = '';
      //logged in user is a clinician
      if (request.params.patientId) {
        patientId = request.params.patientId;
      }
      //Logged in user is a patient
      else {
        patientId = request.auth.credentials.user._id.toString();
      }

      console.log("patientId: " + patientId);

      Async.auto({

        //first we need to find the referenceId of the exercise
        //finding one document matching the query is enough
        findMostRecentReference: function (done) {

          const filter = {
            userId: patientId,
            exerciseId: request.params.exerciseId,
          };

          const pipeLine = [
            {'$match': filter},
            {'$sort': {createdAt: -1}},
            {'$limit': 1}
          ];
          ReferenceExercise.aggregate(pipeLine, done);
        },
        findExercise: ['findMostRecentReference', function (results, done) {

          Exercise.findById(request.params.exerciseId, done);
        }],
        smoothingTest: ['findExercise', function (results, done) {
          let reference = results.findMostRecentReference[0];
          let exercise = results.findExercise;

          let theJoint = exercise.joint;

          let ref_impt_joint_X = [];
          let ref_impt_joint_Y = [];
          let ref_impt_joint_Z = [];

          for (let i = 0; i < reference.bodyFrames.length; ++i) {
            ref_impt_joint_X.push(reference.bodyFrames[i].joints[theJoint]["depthX"]);
            ref_impt_joint_Y.push(reference.bodyFrames[i].joints[theJoint]["depthY"]);
            ref_impt_joint_Z.push(reference.bodyFrames[i].joints[theJoint]["cameraZ"]);
          }
          //console.log(ref_impt_joint_Y);

          let t = [];
          for (let i=0; i<ref_impt_joint_Y.length; i++) {
            t.push(i);
          }
          console.log("t: " + t);
          console.log("raw: " + ref_impt_joint_Y);

          let ref_Y_smoothedAvg = Smoothing(ref_impt_joint_Y, 10, "avg");
          console.log("ref_Y_smoothedAvg: " + ref_Y_smoothedAvg);
          let ref_Y_smoothedTri = Smoothing(ref_impt_joint_Y, 5, "tri");
          let ref_Y_smoothedGauss = Smoothing(ref_impt_joint_Y, 5);

          smoothingResult['t'] = t;
          smoothingResult['raw'] = ref_impt_joint_Y;
          smoothingResult['smoothedAvg'] = ref_Y_smoothedAvg;
          smoothingResult['smoothedTri'] = ref_Y_smoothedTri;
          smoothingResult['smoothedGauss'] = ref_Y_smoothedGauss;

          console.log("smoothed: " + smoothingResult.smoothedGauss);
          done();
        }]
      }, (err, results) => {
        if(err) {
          return reply(err);
        }
        if(!results.findMostRecentReference) {
          return reply(Boom.notFound('Document not found.'));
        }

        return reply.view('userexercise/smoothed-data', {
          data: smoothingResult
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
      ReferenceExercise.findOne({ 'auth.user._id':request.params.id }, (err, document) => {

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
      ReferenceExercise.findOne({}, (err, document) => {

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
