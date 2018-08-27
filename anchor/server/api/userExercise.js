'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');
const DTW = require('dtw');
const helperMethods = require('../helpermethods');

const internals = {};


internals.applyRoutes = function (server, next) {

  const PracticeExercise = server.plugins['hicsail-hapi-mongo-models'].PracticeExercise;
  const ReferenceExercise = server.plugins['hicsail-hapi-mongo-models'].ReferenceExercise;
  const Exercise = server.plugins['hicsail-hapi-mongo-models'].Exercise;
  const User = server.plugins['hicsail-hapi-mongo-models'].User;

//Will eventually get rid of because no longer need user exercises page but this should now load REF EX
  server.route({
    method: 'GET',
    path: '/table/refexercise',
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

      ReferenceExercise.pagedFind({}, fields, sort, limit, page, (err, results) => {

        const referenceExercises = [];
        Async.each(results.data, (referenceExercise, done) => {


          User.findById(referenceExercise.userId, (err, user) => {

            if (err) {
              done(err);
            }
            //need this check because they might have been deleted
            if (user) {
              referenceExercise.name = user.name;
            }
          });

          Exercise.findById(referenceExercise.exerciseId, (err, exercise) => {

            if (err) {
              done(err);
            }
            //need this check because they might have been deleted
            if (exercise) {
              referenceExercise.exerciseName = exercise.exerciseName;
            }

          });

          referenceExercises.push(referenceExercise);
        });

        if (err) {
          return reply(err);
        }

        reply({
          draw: request.query.draw,
          recordsTotal: results.data.length,
          recordsFiltered: results.items.total,
          data: referenceExercises,
          error: err
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/table/userexercise/reference/{userId}',
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

      const query = {
        userId: request.params.userId,
      };

      ReferenceExercise.pagedFind(query, fields, sort, limit, page, (err, results) => {

        const referenceExercises = [];
        Async.each(results.data, (referenceExercise, done) => {

          User.findById(referenceExercise.userId, (err, user) => {

            if (err) {
              done(err);
            }
            if (user) {
              referenceExercise.name = user.name;
            }
          });

          Exercise.findById(referenceExercise.exerciseId, (err, exercise) => {

            if (err) {
              done(err);
            }
            if (exercise) {
              referenceExercise.exerciseName = exercise.exerciseName;
            }

          });

          referenceExercises.push(referenceExercise);
        });

        if (err) {
          return reply(err);
        }

        reply({
          draw: request.query.draw,
          recordsTotal: results.data.length,
          recordsFiltered: results.items.total,
          data: referenceExercises,
          error: err
        });
      });
    }
  });



  // this call does not seem to be used?
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

      ReferenceExercise.pagedFind(query, fields, sort, limit, page, (err, results) => {

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
      };

      ReferenceExercise.find(query, (err, refExercises) => {

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
  //if we want to render them in a table we use this route, using datatable
  //Not currently used?
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
      };

      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      const fields = request.query.fields;


      ReferenceExercise.pagedFind(query, fields, sort, limit, page, (err, results) => {

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

  //this route finds the a reference document for (exerciseId, patientId) with empty bodyFrames
  //the purpose of this route is to find out if a reference with specified setting is already
  //inserted or not
  server.route({
    method: 'GET',
    path: '/userexercise/reference/{exerciseId}/{patientId}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin','clinician']
      }
    },
    handler: function (request, reply) {

      const query = {
        userId: request.params.patientId,
        exerciseId: request.params.exerciseId,
      };

      ReferenceExercise.findOne(query, {sort: {$natural: -1}}, (err, refExercise) => {

        if (err) {
          return reply(err);
        }

        if ( !refExercise || refExercise === undefined ) {
          return reply({ settingIsUpdated: false });
        }

        reply({ settingIsUpdated:true });
      });
    }
  });

  //Route for loading reference frames into exercise session
  server.route({
    method: 'GET',
    path: '/userexercise/loadreference/{exerciseId}/{patientId?}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
    },
    handler: function (request, reply) {

      const query = {
        userId: (request.params.patientId) ? request.params.patientId : request.auth.credentials.user._id.toString(),
        exerciseId: request.params.exerciseId
      };

      ReferenceExercise.findOne(query, {sort: {$natural: -1}}, (err, refExercise) => {

        if (err) {
          return reply(err);
        }

        if ( !refExercise || refExercise === undefined ) {
          return reply('Cannot find reference exercise');
        }

        return reply(refExercise.bodyFrames);
      });
    }
  });

  // this route get the data from the latest version of reference for count reps
  server.route({
    method: 'GET',
    path: '/userexercise/dataforcount/{exerciseId}/{patientId?}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
      }
    },
    handler: function (request, reply) {

      let patientId = '';
      let dataForCntReps = {};
      //logged in user is a clinician
      if (request.params.patientId) {
        patientId = request.params.patientId;
      }
      //Logged in user is a patient
      else {
        patientId = request.auth.credentials.user._id.toString();
      }
      Async.auto({

        //first we need to find the referenceId of the exercise
        //finding one document matching the query is enough
        findMostRecentReference: function (done) {

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
        findExercise:['findMostRecentReference', function (results, done) {

          Exercise.findById(request.params.exerciseId, done);
        }],
        getDataForCntReps: ['findExercise', function(results, done) {
          let reference = results.findMostRecentReference[0];
          let exercise = results.findExercise;

          dataForCntReps['joint'] = exercise.joint;
          dataForCntReps['axis'] = exercise.axis;
          dataForCntReps['direction'] = exercise.direction;
          dataForCntReps['refLowerJointID'] = exercise.refLowerJoint;
          dataForCntReps['refUpperJointID'] = exercise.refUpperJoint;

          if (reference !== undefined) {
            console.log("reference exists");
            // position values below, not jointID, initially undefined
            dataForCntReps['refLowerJointPos'] = reference.refLowerJoint;
            dataForCntReps['refUpperJointPos'] = reference.refUpperJoint;
            dataForCntReps['refMin'] = reference.refMin;
            dataForCntReps['refMax'] = reference.refMax;
            dataForCntReps['neckX'] = reference.neckX;
            dataForCntReps['neckY'] = reference.neckY;
            // numbers between [0,1]
            dataForCntReps['topThresh'] = reference.topThresh;
            dataForCntReps['bottomThresh'] = reference.bottomThresh;
            dataForCntReps['rangeScale'] = reference.rangeScale;
            // time for one repetition in reference, in seconds
            dataForCntReps['refTime'] = reference.refTime;
          }
          //console.log(dataForCntReps);
          done();
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findMostRecentReference) {
          return reply(Boom.notFound('Document not found.'));
        }
        return reply(dataForCntReps);
      });
    }
  });

  // this route checks to see if there is a practice session completed for the latest version of reference
  server.route({
    method: 'GET',
    path: '/userexercise/practice/{exerciseId}/{patientId?}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        // scope: ['root', 'admin','clinician']
      }
    },
    handler: function (request, reply) {

      Async.auto({
        //if there is a previous reference, we must find it so we can
        // re-use its bodyFrames
        findMostRecentReference: function (done) {

          const filter = {
            userId: (request.params.patientId) ? request.params.patientId : request.auth.credentials.user._id.toString(),
            exerciseId: request.params.exerciseId,
          };

          const pipeLine = [
            { '$match': filter },
            { '$sort': { createdAt: -1 } },
            { '$limit': 1 }
          ];
          ReferenceExercise.aggregate(pipeLine, done);
        },
        findPracticeExercise: ['findMostRecentReference', function (results, done) {
          const query = {
            userId: (request.params.patientId) ? request.params.patientId : request.auth.credentials.user._id.toString(),
            exerciseId: request.params.exerciseId,
            referenceId: results.findMostRecentReference[0]._id.toString()
          };
          PracticeExercise.findOne(query, {sort: {$natural: -1}}, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findMostRecentReference) {
          return reply(Boom.notFound('Document not found.'));
        }
        if(results.findPracticeExercise) {
          return reply(results.findPracticeExercise.isComplete);
        }
        reply(false);
      });
    }
  });

  //retrieves practice exercise with a particular referenceId for the logged in patient
  //this route is used if we don't tag practiceExercise documents with a referenceId tag
  //Not used.
  // server.route({
  //   method: 'GET',
  //   path: '/userexercise/practice/{referenceId}',
  //   config: {
  //     auth: {
  //       strategies: ['simple', 'jwt', 'session']
  //     }
  //   },
  //   handler: function (request, reply) {
  //
  //     Async.auto({
  //
  //       //first we need to find the exerciseId of the reference
  //       findExerciseId: function (done) {
  //
  //         PracticeExercise.findById(request.params.referenceId, done);
  //       },
  //       findPracticeExercises:['findExerciseId', function (results, done) {
  //
  //         const query = {
  //           userId: request.auth.credentials.user._id.toString(),
  //           exerciseId: results.findExerciseId.exerciseId,
  //         };
  //
  //         PracticeExercise.find(query, done);
  //       }]
  //     }, (err, results) => {
  //
  //       if (err) {
  //         return reply(err);
  //       }
  //       if (!results.findExerciseId || results.findPracticeExercises === undefined) {
  //         return reply(Boom.notFound('Document not found.'));
  //       }
  //
  //       reply(results.findPracticeExercises);
  //     });
  //   }
  // });
  //
  // //this route finds the exerciseId of a practiceExercise with specified referenceId
  // server.route({
  //   method: 'GET',
  //   path: '/userexercise/exerciseId/{referenceId}',
  //   config: {
  //     auth: {
  //       strategies: ['simple', 'jwt', 'session']
  //     }
  //   },
  //   handler: function (request, reply) {
  //
  //     PracticeExercise.findById(request.params.referenceId, (err, practiceExercise) => {
  //
  //       if (err) {
  //         return reply(err);
  //       }
  //
  //       if (!practiceExercise) {
  //         return reply(Boom.notFound('Document not found.'));
  //       }
  //       reply({ exerciseId: practiceExercise.exerciseId });
  //     });
  //   }
  // });

  server.route({
    method: 'GET',
    path: '/userexercise/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
    },
    handler: function (request, reply) {

      ReferenceExercise.findById(request.params.id, (err, document) => {

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
    method: 'POST',
    path: '/userexercise/reference',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root','admin','clinician']
      },
      validate: {
        payload: ReferenceExercise.referencePayload
      }
    },
    handler: function (request, reply) {

      let bodyFrames = [];
      let neckX, neckY, refMin, refMax, refLowerJoint, refUpperJoint, refTime;

      Async.auto({

        //if there is a previous reference, we must find it so we can
        // re-use its bodyFrames
        findMostRecentReference: function (done) {

          const filter = {
            userId: request.payload.userId,
            exerciseId: request.payload.exerciseId,
          };

          const pipeLine = [
            { '$match': filter },
            { '$sort': { createdAt: -1 } },
            { '$limit': 1 }
          ];
          ReferenceExercise.aggregate(pipeLine, done);
        },
        createReference:['findMostRecentReference', function (results, done) {

          if(results.findMostRecentReference.length > 0 ) {
            if(results.findMostRecentReference[0].bodyFrames.length > 0) {

              let temp = results.findMostRecentReference[0];
              bodyFrames = temp.bodyFrames;
              neckX = temp.neckX;
              neckY = temp.neckY;
              refMin = temp.refMin
              refMax = temp.refMax;
              refLowerJoint = temp.refLowerJoint;
              refUpperJoint = temp.refUpperJoint;
              refTime = temp.refTime;
            }
          }

          ReferenceExercise.create(
            request.payload.userId,
            request.payload.exerciseId,
            request.payload.numSets,
            request.payload.numRepetition,
            request.payload.rangeScale,
            request.payload.topThresh,
            request.payload.bottomThresh,
            bodyFrames,
            neckX,
            neckY,
            refMin,
            refMax,
            refLowerJoint,
            refUpperJoint,
            refTime,
            done);
          }]
        }, (err, results) => {

          if (err) {
            return reply(err);
          }
          reply(results.createReference);
        });
      }
    });

  //this route inserts a new practice exercise document into its respective collection,
  //could be triggered by both clinician and patient,
  server.route({
    method: 'POST',
    path: '/userexercise/practice/{patientId?}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: PracticeExercise.practicePayload
      },
      payload:{ maxBytes: 1048576 * 100 }
    },
    handler: function (request, reply) {

      let patientId = '';
      //logged in user is a clinician
      if (request.params.patientId) {
        patientId = request.params.patientId;
      }
      //Logged in user is a patient
      else {
        patientId = request.auth.credentials.user._id.toString();
      }
      Async.auto({

        //first we need to find the referenceId of the exercise
        //finding one document matching the query is enough
        findMostRecentReference: function (done) {

          const filter = {
            userId: patientId,
            exerciseId: request.payload.exerciseId,
          };

          const pipeLine = [
            { '$match': filter },
            { '$sort': { createdAt: -1 } },
            { '$limit': 1 }
          ];
          ReferenceExercise.aggregate(pipeLine, done);
        },
        createExercise:['findMostRecentReference', function (results, done) {

          PracticeExercise.create(
            patientId,
            request.payload.exerciseId, //taken directly from values.patientId in savePractice
            results.findMostRecentReference[0]._id.toString(),
            request.payload.weekStart, //week started
            done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findMostRecentReference) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(results.createExercise);
      });
    }
  });

  //this route updates the reference for a (userId, exerciseId) pair
  // not used
  server.route({
    method: 'PUT',
    path: '/userexercise/reference/{userId}/{exerciseId}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
      /*validate: {
        payload: ReferenceExercise.updatePayload
      }*/
    },
    handler: function (request, reply) {

      const query = {
        userId: request.params.userId,
        exerciseId: request.params.exerciseId,
      };
      const update = {
        $set: {
          bodyFrames: request.payload.bodyFrames
        }
      };

      ReferenceExercise.findAndUpdate(query, update, (err, document) => {

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

  //this route updates the settings for most recent reference of a (patientId, exerciseId) pair
  //no longer used as new settings create a new reference document
  server.route({
    method: 'PUT',
    path: '/userexercise/reference/mostrecent/setting/{exerciseId}/{patientId}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: ReferenceExercise.updatePayload
      }
    },
    handler: function (request, reply) {

      Async.auto({

        findMostRecentReference: function (done) {

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
        updateSettings:['findMostRecentReference', function (results, done) {

          const id = results.findMostRecentReference[0]._id.toString();
          const update = {
            $set: {
              numSets: request.payload.numSets,
              numRepetition: request.payload.numRepetition,
              rangeScale: request.payload.rangeScale,
              topThresh: request.payload.topThresh,
              bottomThresh: request.payload.bottomThresh
            }
          };
          ReferenceExercise.findByIdAndUpdate(id, update, done);

        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findMostRecentReference[0]) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(results.updateSettings);
      });
    }
  });

  //this route updates the bodyframes and relative data for most recent reference of a (patientId, exerciseId) pair
  server.route({
    method: 'PUT',
    path: '/userexercise/reference/mostrecent/data/{exerciseId}/{patientId}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: ReferenceExercise.dataPayload
      },
      payload:{ maxBytes: 1048576 * 100 }
    },
    handler: function (request, reply) {

      Async.auto({

        findMostRecentReference: function (done) {

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
        updateSettings:['findMostRecentReference', function (results, done) {

          const id = results.findMostRecentReference[0]._id.toString();
          const update = {
            $set: {
              bodyFrames: request.payload.bodyFrames,
              neckX: request.payload.neckX,
              neckY: request.payload.neckY,
              refMin: request.payload.refMin,
              refMax: request.payload.refMax,
              refLowerJoint: request.payload.refLowerJoint,
              refUpperJoint: request.payload.refUpperJoint,
              refTime: request.payload.refTime,
            }
          };
          ReferenceExercise.findByIdAndUpdate(id, update, done);

        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findMostRecentReference[0]) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(results.updateSettings);
      });
    }
  });

  //updates practice document with new set information
  //it also calculates dtw and rep time offline
  server.route({
    method: 'PUT',
    path: '/userexercise/practice/mostrecent/data/{exerciseId}/{patientId?}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: PracticeExercise.dataPayload
      },
      payload:{ maxBytes: 1048576 * 100 }
    },
    handler: function (request, reply) {

      let patientId = '';
      //logged-in user is clinician
      if (request.params.patientId ) {
        patientId = request.params.patientId;
      }
      //logged-in user is patient
      else {
        patientId = request.auth.credentials.user._id.toString();
      }

      let requestPayload = request.payload;
      Async.auto({

        findMostRecentReference: function (done) {

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
        findExercise:['findMostRecentReference', function (results, done) {

          Exercise.findById(request.params.exerciseId, done);
        }],
        findPracticeExercise: ['findExercise', function (results, done) {
          const query = {
            userId: (request.params.patientId) ? request.params.patientId : request.auth.credentials.user._id.toString(),
            exerciseId: request.params.exerciseId,
            referenceId: results.findMostRecentReference[0]._id.toString()
          };
          PracticeExercise.findOne(query, {sort: {$natural: -1}}, done);
        }],
        analyzePractice: ['findPracticeExercise', function(results, done) {
          //TODO: currently only one joint is used for the accuracy
          let theJoint = results.findExercise.joint;
          let theAxis = results.findExercise.axis;
          let theDirection = results.findExercise.direction;
          console.log("the joint: " + theJoint);

          let prac_impt_joint_X = []; //separate X,Y,Z for smoothing
          let prac_impt_joint_Y = [];
          let prac_impt_joint_Z = [];
          let prac_impt_joint; // the chosen axis
          let prac_impt_joint_XYZ = [];
          for (let i=0; i<requestPayload.bodyFrames.length; ++i) {
            prac_impt_joint_X.push(requestPayload.bodyFrames[i].joints[theJoint]["depthX"]);
            prac_impt_joint_Y.push(requestPayload.bodyFrames[i].joints[theJoint]["depthY"]);
            prac_impt_joint_Z.push(requestPayload.bodyFrames[i].joints[theJoint]["cameraZ"]);
          }

          let ref_impt_joint_X = [];
          let ref_impt_joint_Y = [];
          let ref_impt_joint_Z = [];
          let ref_impt_joint;
          let ref_impt_joint_XYZ = [];
          for (let i=0; i<results.findMostRecentReference[0].bodyFrames.length; ++i) {
            ref_impt_joint_X.push(results.findMostRecentReference[0].bodyFrames[i].joints[theJoint]["depthX"]);
            ref_impt_joint_Y.push(results.findMostRecentReference[0].bodyFrames[i].joints[theJoint]["depthY"]);
            ref_impt_joint_Z.push(results.findMostRecentReference[0].bodyFrames[i].joints[theJoint]["cameraZ"]);
          }


          let prac_impt_joint_X_smoothed = smoothGauss(prac_impt_joint_X, 5);
          let prac_impt_joint_Y_smoothed = smoothGauss(prac_impt_joint_Y, 5);
          let prac_impt_joint_Z_smoothed = smoothGauss(prac_impt_joint_Z, 5);
          let std_impt_joint = []; // for establishing the max cost in dtw
          for (let i=0; i<prac_impt_joint_X_smoothed.length; ++i) {
            prac_impt_joint_XYZ.push([prac_impt_joint_X_smoothed[i],prac_impt_joint_Y_smoothed[i],prac_impt_joint_Z_smoothed[i]]);
            std_impt_joint.push(prac_impt_joint_X_smoothed[0], prac_impt_joint_Y_smoothed[0], prac_impt_joint_Z_smoothed[0]);
          }

          let ref_impt_joint_X_smoothed = smoothGauss(ref_impt_joint_X, 5);
          let ref_impt_joint_Y_smoothed = smoothGauss(ref_impt_joint_Y, 5);
          let ref_impt_joint_Z_smoothed = smoothGauss(ref_impt_joint_Z, 5);
          for (let i=0; i<ref_impt_joint_X_smoothed.length; ++i) {
            ref_impt_joint_XYZ.push([ref_impt_joint_X_smoothed[i],ref_impt_joint_Y_smoothed[i],ref_impt_joint_Z_smoothed[i]]);
          }

          //do we need to consider exercise moving in the Z?
          if (theAxis === "depthX") {
            prac_impt_joint = prac_impt_joint_X_smoothed;
            ref_impt_joint = ref_impt_joint_X_smoothed;
          } else if (theAxis === "depthY") {
            prac_impt_joint = prac_impt_joint_Y_smoothed;
            ref_impt_joint = ref_impt_joint_Y_smoothed;
          }

          // //offline speed analysis, could also be used for segmentation
          // let time_thresh = 30; // 1 sec
          // let ifIncreased; // direction flag
          // if(theDirection === 'L2R' || theDirection === 'down') {
          //   ifIncreased = true;
          // } else if (theDirection === 'R2L' || theDirection === 'up') {
          //   ifIncreased = false;
          // } else {
          //   console.log("You should not see this")
          // }
          // console.log("ifIncreased: " + ifIncreased);
          //
          // let prac_idx=[];
          // for (let i=0; i<prac_impt_joint.length - 1; i++) {
          //   let v = prac_impt_joint[i+1] - prac_impt_joint[i];
          //   if(v >= 0) {
          //     if (ifIncreased) {
          //       prac_idx.push([i, true]); // true means moving in the same direction as the exercise
          //       // prac_idx.push([i, (v>=0) === ifIncreased]);
          //     } else {
          //       prac_idx.push([i, false]);
          //     }
          //   } else {
          //     if (ifIncreased) {
          //       prac_idx.push([i, false]);
          //     } else {
          //       prac_idx.push([i, true]);
          //     }
          //   }
          // }
          // console.log(prac_idx);
          //
          // let prac_st=[];
          // let prac_ed=[];
          // let timing = [];
          // let ifFirst = true;
          // for (let ii=0; ii<prac_idx.length-1; ii++) {
          //   if(prac_idx[ii][1] && ifFirst) {
          //     prac_st.push(prac_idx[ii][0]);
          //     ifFirst = false;
          //   } else if (prac_idx[ii][1] === false && prac_idx[ii+1][1]) {
          //     prac_ed.push(prac_idx[ii][0]);
          //     ifFirst = true;
          //   }
          // }
          // if (prac_idx[prac_idx.length-1][1] === false) {
          //   prac_ed.push(prac_idx[prac_idx.length-1][0]);
          // }
          // console.log(prac_st);
          // console.log(prac_ed);
          //
          // for (let j=0; j<prac_st.length; j++) {
          //   let delta = prac_ed[j] - prac_st[j];
          //   if(delta >= time_thresh) {
          //     timing.push(delta);
          //   }
          // }
          // console.log("timing array:" + timing); //TODO: output is empty, sth wrong
          let prac_timing = getSegmentation(prac_impt_joint, theDirection, 30);
          let ref_timing = getSegmentation(ref_impt_joint, theDirection, 30);
          console.log("prac timing: " + prac_timing);
          console.log("ref timing: " + ref_timing);

          //TODO: Or we compare total time for speed analysis
          // let prac_ttl;
          // let n = requestPayload.repEvals.length; //number of reps
          // for (let i=0; i<n; i++){
          //   prac_ttl =+ requestPayload.repEvals[i].speed; // cannot handle when repEvals.speed = 0
          // }
          // let ref_ttl = results.findMostRecentReference[0].refTime;
          let nFrames_prac = requestPayload.bodyFrames.length;
          let prac_ttl = Math.round(nFrames_prac/30);
          let nFrames_ref = results.findMostRecentReference[0].bodyFrames.length;
          let ref_ttl = Math.round(nFrames_ref/30);

          let msg_speed = "You have done " + n + " repititions for this set.\nIt takes you " + prac_ttl + " seconds to complete.\nYour reference time is " + ref_ttl + " seconds.\n"
          console.log(msg_speed);



          let dtw_impt_joint_XYZ = new DTW();
          let cost_XYZ = dtw_impt_joint_XYZ.compute(ref_impt_joint_XYZ, prac_impt_joint_XYZ);
          //let path_XYZ = dtw_impt_joint_XYZ.path();

          let dtw_maxCost = new DTW();
          let cost_max = dtw_maxCost.compute(ref_impt_joint_XYZ, std_impt_joint);

          let acc = cost_XYZ / cost_max;

          let msg_dtw_XYZ = "DTW cost: " + cost_XYZ + '\n';
          let msg_dtw_max = "Maximum cost: " + cost_max + '\n';
          console.log(msg_dtw_XYZ);
          console.log(msg_dtw_max);
          console.log("Accuracy: " + acc);

          // TODO:
          let analysis = {"accuracy": acc, "speed": 123 };
          done();
        }],
        findPracticeandUpdate: ['analyzePractice', function(results, done) {
          console.log("results.analyzePractice = " + results.analyzePractice);
          const query = {
            userId: patientId,
            exerciseId: request.params.exerciseId,
            referenceId: results.findMostRecentReference[0]._id.toString()
          };

          let update = {
            $addToSet: {
              sets: {date: new Date(),
                onlineSpeed: requestPayload.repEvals,
                analysis: results.analyzePractice,
                bodyFrames: requestPayload.bodyFrames}
            },
            $inc: {
              numSetsCompleted: 1,
            },
            $set: {
              weekEnd: (requestPayload.weekEnd) ? requestPayload.weekEnd : -1,
              numRepsCompleted: requestPayload.repEvals.length
            }
          };

          if(results.findPracticeExercise.numSetsCompleted + 1 === results.findMostRecentReference[0].numSets) {
            update = {
              $addToSet: {
                sets: {date: new Date(),
                  onlineSpeed: requestPayload.repEvals,
                  analysis: results.analyzePractice,
                  bodyFrames: requestPayload.bodyFrames}
              },
              $inc: {
                numSetsCompleted: 1,
              },
              $set: {
                weekEnd: (requestPayload.weekEnd) ? requestPayload.weekEnd : -1,
                numRepsCompleted: requestPayload.repEvals.length,
                isComplete: true
              }
            };
          }
          PracticeExercise.findOneAndUpdate(query, update, {sort: {$natural: -1}}, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(results);
        }
        if (!results.findMostRecentReference[0]) {
          return reply(Boom.notFound('Document not found.'));
        }
        reply(results.findPracticeandUpdate);
      });
    }
  });

  //this route sends the analysis result to the client
  server.route({
    method: 'GET',
    path: '/userexercise/practiceanalysis/{exerciseId}/{patientId?}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        // scope: ['root', 'admin','clinician']
      }
    },
    handler: function (request, reply) {

      Async.auto({
        //if there is a previous reference, we must find it so we can
        //re-use its bodyFrames
        findMostRecentReference: function (done) {

          const filter = {
            userId: (request.params.patientId) ? request.params.patientId : request.auth.credentials.user._id.toString(),
            exerciseId: request.params.exerciseId,
          };

          const pipeLine = [
            { '$match': filter },
            { '$sort': { createdAt: -1 } },
            { '$limit': 1 }
          ];
          ReferenceExercise.aggregate(pipeLine, done);
        },
        findPracticeExercise: ['findMostRecentReference', function (results, done) {
          const query = {
            userId: (request.params.patientId) ? request.params.patientId : request.auth.credentials.user._id.toString(),
            exerciseId: request.params.exerciseId,
            referenceId: results.findMostRecentReference[0]._id.toString()
          };
          PracticeExercise.findOne(query, {sort: {$natural: -1}}, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findMostRecentReference) {
        return reply(Boom.notFound('Document not found.'));
      }
      if(results.findPracticeExercise) {
          let set_len = results.findPracticeExercise.sets.length; // the most recent
          console.log("set length: " + set_len);
        return reply(results.findPracticeExercise.sets[set_len-1].analysis);
      }
      reply(false);
    });
    }
  });


  // not used
  server.route({
    method: 'PUT',
    path: '/userexercise/reference/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: ReferenceExercise.updatePayload
      }
    },
    handler: function (request, reply) {

      const update = {
        $set: {
          numSets: request.payload.numSets,
          numRepetition: request.payload.numRepetition
        }
      };

      ReferenceExercise.findByIdAndUpdate(request.params.id, update, (err, document) => {
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
        scope: ['root','admin','clinician']
      }
    },
    handler: function (request, reply) {

      ReferenceExercise.findByIdAndDelete(request.params.id, (err, document) => {

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

  // for smoothing test
  server.route({
    method: 'GET',
    path: '/userexercise/smoothingtest/{exerciseId}/{patientId?}',
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
      Async.auto({

        //first we need to find the referenceId of the exercise
        //finding one document matching the query is enough
        findMostRecentReference: function (done) {

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
        findExercise:['findMostRecentReference', function (results, done) {

          Exercise.findById(request.params.exerciseId, done);
        }],
        smoothingTest: ['findExercise', function(results, done) {
          let reference = results.findMostRecentReference[0];
          let exercise = results.findExercise;

          let theJoint = exercise.joint;

          let ref_impt_joint_X = [];
          let ref_impt_joint_Y = [];
          let ref_impt_joint_Z = [];

          for (let i=0; i< reference.bodyFrames.length; ++i) {
            ref_impt_joint_X.push(reference.bodyFrames[i].joints[theJoint]["depthX"]);
            ref_impt_joint_Y.push(reference.bodyFrames[i].joints[theJoint]["depthY"]);
            ref_impt_joint_Z.push(reference.bodyFrames[i].joints[theJoint]["cameraZ"]);
          }
          //console.log(ref_impt_joint_Y);

          let t = getRange(0, ref_impt_joint_Y.length);
          console.log("t: " + t);
          console.log("raw: " + ref_impt_joint_Y);

          let ref_Y_smoothedAvg = smoothAvg(ref_impt_joint_Y, 10);
          let ref_Y_smoothedTri = smoothTri(ref_impt_joint_Y, 5);
          let ref_Y_smoothedGauss = smoothGauss(ref_impt_joint_Y, 5);

          smoothingResult['t'] = t;
          smoothingResult['raw'] = ref_impt_joint_Y;
          smoothingResult['smoothedAvg'] = ref_Y_smoothedAvg;
          smoothingResult['smoothedTri'] = ref_Y_smoothedTri;
          smoothingResult['smoothedGauss'] = ref_Y_smoothedGauss;

          //console.log("smoothed: " + smoothingResult.smoothedAvg);
          done();
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        if (!results.findMostRecentReference) {
        return reply(Boom.notFound('Document not found.'));
        }
        return reply(smoothingResult);

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
  name: 'practiceExercises'
};
