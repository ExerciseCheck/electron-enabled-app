'use strict';
const internals = {};
const Config = require('../../../config');
const Exercise = require('../../models/exercise');
const Async = require('async');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/clinician',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('clinician/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Clinician',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/clinician/patientexercises/{patientId}',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      Exercise.find({}, (err, exercises) => {

        if (err) {
          return reply(err);
        }
        //add the patientId to each exercise so we can access the patientId on the template
        Async.each(exercises, (exercise, callback) => {

          exercise.patientId = request.params.patientId;
          callback(null, exercise);
        });

        return reply.view('clinician/viewpatientexercises', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          title: 'Exercises',
          baseUrl: Config.get('/baseUrl'),
          exercises,
          patientId: request.params.patientId
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
  name: 'ClinicianList',
  dependencies: 'visionary'
};
