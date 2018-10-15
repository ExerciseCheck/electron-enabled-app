'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');
const DTW = require('dtw');
const Smoothing = require('../web/helpers/smoothingMethod');
const Segs = require('../web/helpers/segmentation');

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
          // numbers between [0,1]
          dataForCntReps['diffLevel'] = reference.diffLevel;

          if (reference.bodyFrames[0] !== undefined) {
            console.log("reference.bodyFrames exists");
            dataForCntReps['refMin'] = reference.refMin;
            dataForCntReps['refMax'] = reference.refMax;
            dataForCntReps['bodyHeight'] = reference.neck2spineBase;
            dataForCntReps['bodyWidth'] = reference.shoulder2shoulder;
            dataForCntReps['jointNeck'] = reference.bodyFrames[0].joints[2];
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
      let neck2spineBase, shoulder2shoulder, refMin, refMax, refTime;

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
              neck2spineBase = temp.neck2spineBase;
              shoulder2shoulder = temp.shoulder2shoulder;
              refMin = temp.refMin
              refMax = temp.refMax;
              refTime = temp.refTime;
            }
          }

          ReferenceExercise.create(
            request.payload.userId,
            request.payload.exerciseId,
            request.payload.numSets,
            request.payload.numRepetition,
            request.payload.diffLevel,
            bodyFrames,
            neck2spineBase,
            shoulder2shoulder,
            refMin,
            refMax,
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
              diffLevel: request.payload.diffLevel,
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
              neck2spineBase: request.payload.neck2spineBase,
              shoulder2shoulder: request.payload.shoulder2shoulder,
              refMin: request.payload.refMin,
              refMax: request.payload.refMax,
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
          // from exercise
          let theJoint = results.findExercise.joint;
          let theAxis = results.findExercise.axis;
          let theDirection = results.findExercise.direction;
          // from reference
          let refJointNeck = results.findMostRecentReference[0].bodyFrames[0].joints[2];

          let prac_impt_joint_X = []; //separate X,Y,Z for smoothing
          let prac_impt_joint_Y = [];
          let prac_impt_joint_Z = [];
          let prac_impt_joint; // the chosen axis
          let prac_impt_joint_XYZ = [];
          // For normalization:
          let prac_shoulderL2R = requestPayload.bodyFrames[0].joints[8]["depthX"] - requestPayload.bodyFrames[0].joints[4]["depthX"];
          let prac_neck2base = requestPayload.bodyFrames[0].joints[0]["depthY"] - requestPayload.bodyFrames[0].joints[2]["depthY"];
          //let prac_depth = ??

          for (let i=0; i<requestPayload.bodyFrames.length; ++i) {
            prac_impt_joint_X.push((requestPayload.bodyFrames[i].joints[theJoint]["depthX"] - requestPayload.bodyFrames[0].joints[2]["depthX"]) / prac_shoulderL2R);
            prac_impt_joint_Y.push((requestPayload.bodyFrames[i].joints[theJoint]["depthY"] - requestPayload.bodyFrames[0].joints[2]["depthY"]) / prac_neck2base);
            prac_impt_joint_Z.push(requestPayload.bodyFrames[i].joints[theJoint]["cameraZ"] - requestPayload.bodyFrames[0].joints[2]["cameraZ"]);
          }

          let prac_impt_joint_X_smoothed = Smoothing(prac_impt_joint_X, 5);
          let prac_impt_joint_Y_smoothed = Smoothing(prac_impt_joint_Y, 5);
          let prac_impt_joint_Z_smoothed = Smoothing(prac_impt_joint_Z, 5);
          let std_impt_joint_XYZ = []; // for establishing the max cost in dtw
          for (let i=0; i<prac_impt_joint_X_smoothed.length; ++i) {
            prac_impt_joint_XYZ.push([prac_impt_joint_X_smoothed[i],prac_impt_joint_Y_smoothed[i],prac_impt_joint_Z_smoothed[i]]);
            std_impt_joint_XYZ.push([prac_impt_joint_X_smoothed[0], prac_impt_joint_Y_smoothed[0], prac_impt_joint_Z_smoothed[0]]);
          }

          let ref_impt_joint_X = [];
          let ref_impt_joint_Y = [];
          let ref_impt_joint_Z = [];
          let ref_impt_joint;
          let ref_impt_joint_XYZ = [];
          // For normalization:
          let ref_shoulderL2R = results.findMostRecentReference[0].bodyFrames[0].joints[8]["depthX"]
            - results.findMostRecentReference[0].bodyFrames[0].joints[4]["depthX"];
          let ref_neck2base = results.findMostRecentReference[0].bodyFrames[0].joints[0]["depthY"]
            - results.findMostRecentReference[0].bodyFrames[0].joints[2]["depthY"];
          //let ref_depth = ??

          for (let i=0; i<results.findMostRecentReference[0].bodyFrames.length; ++i) {
            ref_impt_joint_X.push(
              (results.findMostRecentReference[0].bodyFrames[i].joints[theJoint]["depthX"] - refJointNeck["depthX"]) / ref_shoulderL2R);
            ref_impt_joint_Y.push(
              (results.findMostRecentReference[0].bodyFrames[i].joints[theJoint]["depthY"] - refJointNeck["depthY"]) / ref_neck2base);
            ref_impt_joint_Z.push(results.findMostRecentReference[0].bodyFrames[i].joints[theJoint]["cameraZ"] - refJointNeck["cameraZ"]);
          }

          let ref_impt_joint_X_smoothed = Smoothing(ref_impt_joint_X, 5);
          let ref_impt_joint_Y_smoothed = Smoothing(ref_impt_joint_Y, 5);
          let ref_impt_joint_Z_smoothed = Smoothing(ref_impt_joint_Z, 5);
          // Assumption:
          // 1) patient does 1 repetition per referenceExercise
          // 2) referenceExercise always has a clean stop (clinician clicks the STOP button for the patient)
          // 3) so we multiply the rep by numRep required
          // 4) no need to segment referenceExercise in such case
          for (let j=0; j<results.findMostRecentReference[0].numRepetition; ++j) {
            for (let i=0; i<ref_impt_joint_X_smoothed.length; ++i) {
              ref_impt_joint_XYZ.push([ref_impt_joint_X_smoothed[i],ref_impt_joint_Y_smoothed[i],ref_impt_joint_Z_smoothed[i]]);
            }
          }
          console.log("ref with 1 rep, length=" + ref_impt_joint_X_smoothed.length);
          console.log("ref with N reps, length=" + ref_impt_joint_XYZ.length);
          if (theAxis === "depthX") {
            prac_impt_joint = prac_impt_joint_X_smoothed;
          } else if (theAxis === "depthY") {
            prac_impt_joint = prac_impt_joint_Y_smoothed;
          }
          // assuming each repetition for any exercise takes >= 1 sec
          let prac_timing = Segs(prac_impt_joint, theDirection, 20);

          // use total timing for the practice here
          let prac_ttl = prac_timing.reduce((a,b) => a+b, 0);
          let ref_ttl = ref_impt_joint_XYZ.length;
          console.log("prac timing: " + prac_timing + "\t" + prac_ttl);
          console.log("ref timing: " + ref_ttl);
          let spd = ref_ttl / prac_ttl;

          let dtw_impt_joint_XYZ = new DTW();
          let cost_XYZ = dtw_impt_joint_XYZ.compute(ref_impt_joint_XYZ, prac_impt_joint_XYZ);
          //let path_XYZ = dtw_impt_joint_XYZ.path();

          let dtw_maxCost = new DTW();
          let cost_max = dtw_maxCost.compute(ref_impt_joint_XYZ, std_impt_joint_XYZ);

          let acc = 1 - cost_XYZ / cost_max;
          if(acc<0) acc=0;

          let msg_dtw_XYZ = "DTW cost: " + cost_XYZ + '\n';
          let msg_dtw_max = "Maximum cost: " + cost_max + '\n';
          console.log(msg_dtw_XYZ);
          console.log(msg_dtw_max);

          let analysis = {"accuracy": acc, "speed": spd };
          let acc_str = (acc * 100).toFixed(2) + "%";
          let spd_str = (spd * 100).toFixed(2) + "%";
          // let analysis = {"accuracy": acc_str, "speed": spd_str };
          console.log("accuracy: " + acc_str + "\nspeed: " + spd_str);
          done(null, analysis);
        }],
        findPracticeandUpdate: ['analyzePractice', function(results, done) {

          // console.log("results.analyzePractice: " + results.analyzePractice); //[object object]
          // console.log("stringify: " + JSON.stringify(results.analyzePractice)); //{"accuracy": 0.945..., "speed": 0.729...}
          // console.log("results.analyzePractice.accuracy: " + results.analyzePractice.accuracy); //0.945...

          const query = {
            userId: patientId,
            exerciseId: request.params.exerciseId,
            referenceId: results.findMostRecentReference[0]._id.toString()
          };

          let update = {
            $addToSet: {
              sets: {date: new Date(),
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
        // reply(results.analyzePractice);
        reply(results.analyzePractice);
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
        if (
          !document) {
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

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hicsail-hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'practiceExercises'
};
