'use strict';
const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Exercise = server.plugins['hicsail-hapi-mongo-models'].Exercise;

  server.route({
    method: 'GET',
    path: '/table/exercise',
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
      Exercise.pagedFind({}, fields, sort, limit, page, (err, results) => {

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
    path: '/exercise',
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

      Exercise.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  //this route finds all the exercises created by the logged-in user
  server.route({
    method: 'GET',
    path: '/exercise/my',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
    },
    handler: function (request, reply) {

      const userID = request.auth.credentials.user._id.toString();

      const query = {
        userId: userID
      };


      Exercise.find(query, (err, results) => {

        if (err) {
          return reply(err);
        }

        if (!results || results === undefined){
          return reply(Boom.notFound('Document not found.'));
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/exercise/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin', 'researcher']
      }
    },
    handler: function (request, reply) {

      Exercise.findById(request.params.id, (err, result) => {

        if (err) {
          return reply(err);
        }

        if (!result || result === undefined){
          return reply(Boom.notFound('Document not found.'));
        }
        reply(result);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/exercise',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: Exercise.payload
      }
    },
    handler: function (request, reply) {

      Exercise.create(
        request.payload.exerciseName,
        request.payload.description,
        request.auth.credentials.user._id.toString(),
        (err, document) => {

          if (err) {
            return reply(err);
          }

          reply(document);

        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/exercise/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin']
      },
      validate: {
        payload: Exercise.payload
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;

      const update = {
        $set: {
          exerciseName: request.payload.exerciseName,
          description: request.payload.description
        }
      };

      Exercise.findByIdAndUpdate(id, update, (err, results) => {

        if (err) {
          return reply(err);
        }

        if (!results || results === undefined) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/exercise/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin']
      }
    },
    handler: function (request, reply) {

      Exercise.findByIdAndDelete(request.params.id, (err, document) => {

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

  /*server.route({
    method: 'GET',
    path: '/table/Exercise',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: function (request, reply) {

      const accessLevel = User.highestRole(request.auth.credentials.user.roles);
      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      let fields = request.query.fields;

      const query = {};
      //no role
      if (accessLevel === 0) {
        query.userId = request.auth.credentials.user._id.toString();
      }
      //analyst
      else if (accessLevel === 1) {
        if (fields) {
          fields = fields.split(' ');
          let length = fields.length;
          for (let i = 0; i < length; ++i) {
            if (User.PHI().concat(['key']).indexOf(fields[i]) !== -1) {

              fields.splice(i, 1);
              i--;
              length--;
            }
          }
          fields = fields.join(' ');
        }
      }
      //clinician
      else if (accessLevel === 2) {
        query.username = request.auth.credentials.user.username;
      }
      //researcher
      else if (accessLevel === 3) {
        query.userId = request.auth.credentials.user._id.toString();
      }

      let userFields = 'studyID username';
      if (accessLevel === 1) {
        //if analyst remove PHI
        userFields = userFields.split(' ');
        let length = userFields.length;
        for (let i = 0; i < length; ++i) {
          if (User.PHI().indexOf(userFields[i]) !== -1) {

            userFields.splice(i, 1);
            i--;
            length--;
          }
        }
        userFields = userFields.join(' ');
      }
      userFields = User.fieldsAdapter(userFields);

      Exercise.pagedLookupById(query,sort,limit,page,User,'user','userId',fields, userFields, (err, results) => {

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
  });*/


  server.route({
    method: 'GET',
    path: '/select2/exercise',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        query: {
          term: Joi.string(),
          _type: Joi.string(),
          q: Joi.string()
        }
      }
    },
    handler: function (request, reply) {


      const query = {
        exerciseName: { $regex: request.query.term, $options: 'i' }
      };

      const fields = 'name';
      const limit = 25;
      const page = 1;

      Exercise.pagedFind(query, fields, null, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({
          results: results.data,
          pagination: {
            more: results.pages.hasNext
          }
        });
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
  name: 'exercise'
};
