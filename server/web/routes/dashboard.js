'use strict';
const internals = {};
const Async = require('async');
const Boom = require('boom');
const Config = require('../../../config');
const UserExercise = require('../../models/userExercise');
const Exercise = require('../../models/exercise');

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

      if (!request.auth.isAuthenticated || request.auth.credentials.user.roles.admin || request.auth.credentials.user.roles.root || request.auth.credentials.user.roles.clinician) {

        return reply.view('dashboard/index', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          title: 'Dashboard',
          baseUrl: Config.get('/baseUrl')
        });
      }



      Async.auto({

        findRefExercises: function (done) {

          const query = {
            userId: request.auth.credentials.user._id.toString(),
            type: 'Reference'
          };

          UserExercise.find(query, done);
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
        findLatestSession:['exercises', function (results, done) {

          const pipeLine = [
            { '$match': { 'userId' : request.auth.credentials.user._id.toString() } },
            { '$group': {
              '_id': null,
              'latestSession': { '$last': '$createdAt' }
            }
            }
          ];

          UserExercise.aggregate(pipeLine, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        if (!results.exercises || !results.findLatestSession) {
          return reply(Boom.notFound('Document not found.'));
        }

        return reply.view('patient/viewExercises', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          title: 'Dashboard',
          exercises: results.exercises,
          lastSession: results.findLatestSession[0].latestSession,
          baseUrl: Config.get('/baseUrl')
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
  name: 'dashboard',
  dependencies: 'visionary'
};
