'use strict';
const internals = {};
const Config = require('../../../config');
const Algorithm = require('public/scripts/algorithm');


internals.applyRoutes = function (server, next) {

  server.route({
    method: 'POST',
    path: '/dtw_test',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      const reference = request.payload.data.ref;
      console.log('after reference from reqeust');
      const exercise = request.payload.data.ex;
      console.log('after ex from request');

      const dtw_path = Algorithm.dtw(reference, exercise, 11);
      console.log(dtw_path);

      return reply.view('dtw_test/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'DTW Test',
        baseUrl: Config.get('/baseUrl')
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
  name: 'dtwTest',
  dependencies: 'visionary'
};
