'use strict';
const internals = {};
const Config = require('../../../config');
const Exercise = require('../../models/exercise');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/exercise',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('exercise/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Exercises',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/exercise/create',
    config: {
      auth: {
        strategy: 'session',
        scope: ['root', 'admin','researcher','clinician']
      }
    },
    handler: function (request, reply) {

      return reply.view('exercise/create', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Exercises',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/exercise/edit/{id}',
    config: {
      auth: {
        strategy: 'session',
        scope: ['root','admin','clinician']
      }
    },
    handler: function (request, reply) {

      Exercise.findById(request.params.id, (err, exercise) => {

        if (err) {
          return reply(err);
        }

        return reply.view('exercise/edit', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          title: 'Exercises',
          baseUrl: Config.get('/baseUrl'),
          exercise
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
  name: 'exerciseList',
  dependencies: 'visionary'
};
