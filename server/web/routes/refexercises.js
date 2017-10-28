'use strict';
const internals = {};
const Config = require('../../../config');
const RefExercise = require('../../models/refexercise');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/refexercises',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('refexercises/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/refexercises/create',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('refexercises/create', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/refexercises/{id}',
    config: {
      auth: {
        strategy: 'session',
        scope: ['root','admin']
      }
    },
    handler: function (request, reply) {

      RefExercise.findById(request.params.id, (err, document) => {

        if (err) {
          return reply(err);
        }

        return reply.view('refexercises/edit', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName')
        });
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/refexercises/play',
    config: {
      // auth: {
      //   strategy: 'session',
      //   scope: ['root','admin']
      // }
    },
    handler: function (request, reply) {

      //noinspection JSAnnotator
      RefExercise.findOne({}, (err, document) => {

        if (err) {
          return reply(err);
        }

        return reply.view('refexercises/play', {
          frameData: document["bodyFrames"]
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
  name: 'refexercisesList',
  dependencies: 'visionary'
};
