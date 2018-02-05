'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const UserExercise = server.plugins['hicsail-hapi-mongo-models'].UserExercise;

  server.route({
    method: 'GET',
    path: '/table/userexercise',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: function (request, reply) {

      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      const fields = request.query.fields;
      UserExercise.pagedFind({}, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({
          draw: request.query.draw,
          recordsTotal: results.data.length,
          recordsFiltered: results.items.total,
          data: results.data,
          error: err
        });
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/userexercise',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin', 'researcher']
      },
      validate: {
        query: {
          fields: Joi.string(),
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      }
    },
    handler: function (request, reply) {

      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      UserExercise.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  //retrieves reference exercise for the logged-in patient, used in #16
  //if want to render them as a list we use this routes
  server.route({
    method: 'GET',
    path: '/userexercise/reference/my',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
    },
    handler: function (request, reply) {

      const query = {
        userId: request.auth.credentials.user._id.toString(),
        type: 'Reference'
      };

      UserExercise.find(query, (err, refExercises) => {

        if (err) {
          return reply(err);
        }

        if (!refExercises) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(refExercises);
      });
    }
  });

  //retrieves reference exercise for the logged-in patient, used in #16
  //if we want to rende them in a table we use this route, using datatable
  server.route({
    method: 'GET',
    path: '/table/userexercise/reference/my',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: function (request, reply) {

      const query = {
        userId: request.auth.credentials.user._id.toString(),
        type: 'Reference'
      };

      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      const fields = request.query.fields;


      UserExercise.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({
          draw: request.query.draw,
          recordsTotal: results.data.length,
          recordsFiltered: results.items.total,
          data: results.data,
          error: err
        });
      });
    }
  });


  //retrieves practice exercise with a particular referenceId for the logged in patient
  //this route is used if we tag userExercise documents with a referenceId tag 
  server.route({
    method: 'GET',
    path: '/userexercise/practice/{referenceId}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
    },
    handler: function (request, reply) {

      const query = {
        userId: request.auth.credentials.user._id.toString(),
        referenceId: request.params.referenceId,
        type: 'Practice'
      };

      UserExercise.find(query, (err, practiceExercises) => {

        if (err) {
          return reply(err);
        }

        if (!practiceExercises) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(practiceExercises);
      });
    }
  });

  //retrieves practice exercise with a particular referenceId for the logged in patient
  //this route is used if we don't tag userExercise documents with a referenceId tag 
  /*server.route({
    method: 'GET',
    path: '/userexercise/practice/{referenceId}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
    },
    handler: function (request, reply) {
    
      Async.auto({

        //first we need to find the exerciseId of the reference
        findExerciseId: function (done) {

          UserExercise.findById(request.params.referenceId, done);
        },
        findPracticeExercises:['findExerciseId', function (results, done) {

          const query = {
            userId: request.auth.credentials.user._id.toString(),
            exerciseId: results.findExerciseId.exerciseId,
            type: 'Practice'
          };

          UserExercise.find(query, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findExerciseId || results.findPracticeExercises === undefined) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(results.findPracticeExercises);
      });
    }
  });*/


  server.route({
    method: 'GET',
    path: '/userexercise/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
    },
    handler: function (request, reply) {

      UserExercise.findById(request.params.id, (err, document) => {

        if (err) {
          return reply(err);
        }

        if (!document) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(document);
      });
    }
  });

  //this route inserts a new exercise of type Reference into userExercise collection, trrigered only by clinician 
  server.route({
    method: 'POST',
    path: '/userexercise/reference',
    config: {
      /*validate: {
        payload: UserExercise.referencePayload
      }*/
    },

    handler: function (request, reply) {

      UserExercise.create(
        request.payload.userId,
        request.payload.exerciseId,
        'Reference',
        request.payload.numSessions,
        -1,
        request.payload.bodyFrames,
        (err, document) => {

          if (err) {
            return reply(err);
          }

          reply(document);

        });
    }
  });

  //this route inserts a new exercise of type Practice into userExercise collection, 
  //could be trrigered by both clinician and patient,  
  server.route({
    method: 'POST',
    path: '/userexercise/practice',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
      /*validate: {
        payload: UserExercise.practicePayload
      }*/
    },
    handler: function (request, reply) {

      Async.auto({

        //first we need to find the referenceId of the exercise
        //finding one document matching the query is enough
        findReference: function (done) {

          const query = {
            userId: request.payload.userId,
            exerciseId: request.payload.exerciseId,
            type: 'Reference'
          };

          UserExercise.findOne(query, done);
        },
        createExercise:['findReference', function (results, done) {

          UserExercise.create(
            request.payload.userId,
            request.payload.exerciseId,
            'Practice',
            results.findReference.numSessions,
            results.findReference.referenceId,
            request.payload.bodyFrames,
            done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findExerciseId || results.findPracticeExercises === undefined) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(results.createExercise);
      });
    }
  });

  //this route updates the reference for a (userId, exerciseId) pair
  server.route({
    method: 'PUT',
    path: '/userexercise/reference/{userId}/{exerciseId}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
      /*validate: {
        payload: UserExercise.updatePayload
      }*/
    },
    handler: function (request, reply) {

      const query = {
        userId: request.params.userId,
        exerciseId: request.params.exerciseId,
        type: 'Reference'
      };
      const update = {
        $set: {
          bodyFrames: request.payload.bodyFrames
        }
      };

      UserExercise.findAndUpdate(query, update, (err, document) => {

        if (err) {
          return reply(err);
        }

        if (!document) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(document);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/userexercise/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root','admin']
      }
    },
    handler: function (request, reply) {

      UserExercise.findByIdAndDelete(request.params.id, (err, document) => {

        if (err) {
          return reply(err);
        }

        if (!document) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply({ message: 'Success.' });
      });
    }
  });


  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hicsail-hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'userExercises'
};
