'use strict';
const internals = {};
const Async = require('async');
const Boom = require('boom');
const Config = require('../../../config');
const PracticeExercise = require('../../models/practiceExercise');
const ReferenceExercise = require('../../models/referenceExercise');
const Exercise = require('../../models/exercise');
const User = require('../../models/user');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/dashboard',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      if (!request.auth.isAuthenticated || request.auth.credentials.user.roles.admin || request.auth.credentials.user.roles.root) {

        return reply.view('dashboard/index', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          title: 'Dashboard',
          baseUrl: Config.get('/baseUrl')
        });
      }

      //if logged in user is clinician we display list of patients associated with clinician
      else if (request.auth.credentials.user.roles.clinician) {
        const clinicianId = request.auth.credentials.user._id.toString();
        const patients = [];
        User.findById(clinicianId, (err, clinician) => {

          let users = [];

          if (clinician.roles.clinician.userAccess.length !== 0) {
            users = JSON.parse(clinician.roles.clinician.userAccess);
          }
          Async.each(users, (patientId, done) => {

            User.findById(patientId, (err, user) => {

              //we need to add this condition to be able to handle deleted patients
              if (user) {
                const patient = {};
                patient.patientId = patientId;

                if (err) {
                  done(err);
                }

                patient.name = user.name;
                patients.push(patient);
              }

            });
          });

          if (err) {
            return reply(err);
          }

          return reply.view('clinician/viewpatients', {
            user: request.auth.credentials.user,
            projectName: Config.get('/projectName'),
            title: 'Dashboard',
            patients,
            users,
            baseUrl: Config.get('/baseUrl')
          });
        });
      }

      else {
        Async.auto({

          findRefExercises: function (done) {

            const query = {
              userId: request.auth.credentials.user._id.toString(),
              // with the current design and workflow, having a referene means having not-empty bodyFrames
              bodyFrames : { $ne : [] }
            };

            ReferenceExercise.find(query, done);
          },
          exercises:['findRefExercises', function (results, done) {

            const Ids = [];
            const length = results.findRefExercises.length;

            //if there are no refrence exercises for the user show the original version of dashboard for now
            //eventully we won't need to have this check becuase we konw that patients will log in only after
            //they have recorded a reference exercise
            if (length === 0) {

              return reply.view('dashboard/index', {
                user: request.auth.credentials.user,
                projectName: Config.get('/projectName'),
                title: 'Dashboard',
                baseUrl: Config.get('/baseUrl')
              });

            }

            for (let i = 0; i < length; ++i) {

              Ids[i] = Exercise.ObjectId(results.findRefExercises[i].exerciseId);
            }

            const query = {
              _id : { $in : Ids }
            };

            Exercise.find(query, done);
          }],
          getLatestPracticeSession:['exercises', function (results, done) {

           const pipeLine = [
             { '$match': { 'userId' : request.auth.credentials.user._id.toString() } },
             { '$group': {
               '_id': null,
               'latestSession': { '$last': '$createdAt' }
             }
             }
           ];
           PracticeExercise.aggregate(pipeLine, done);
         }],
         getLatestReferenceSession:['getLatestPracticeSession', function (results, done) {
           const pipeLine = [
             { '$match': { 'userId' : request.auth.credentials.user._id.toString() } },
             { '$group': {
               '_id': null,
               'latestSession': { '$last': '$createdAt' }
             }
             }
           ];
           ReferenceExercise.aggregate(pipeLine, done);
         }]
       }, (err, results) => {
          let latestSesh = null;
          if (err) {
            return reply(err);
          }

          if (!results.exercises || !results.getLatestReferenceSession) {
            return reply(Boom.notFound('Document not found.'));
          }
          return reply.view('patient/viewExercises', {
            user: request.auth.credentials.user,
            projectName: Config.get('/projectName'),
            title: 'Dashboard',
            exercises: results.exercises,
            lastSession: (results.getLatestPracticeSession.length === 0) ?
              results.getLatestReferenceSession[0].latestSession :
              results.getLatestPracticeSession[0].latestSession,
            baseUrl: Config.get('/baseUrl')
          });
        });
      }
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'dashboard',
  dependencies: 'visionary'
};
