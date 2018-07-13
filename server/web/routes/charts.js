'use strict';
const internals = {};
const Config = require('../../../config');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/charts',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('charts/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Charts',
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
  name: 'charts',
  dependencies: 'visionary'
};
