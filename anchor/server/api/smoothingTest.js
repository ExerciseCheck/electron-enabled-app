'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');
const DTW = require('dtw');
const _ = require('lodash');


const internals = {};


internals.applyRoutes = function (server, next) {

  const PracticeExercise = server.plugins['hicsail-hapi-mongo-models'].PracticeExercise;
  const ReferenceExercise = server.plugins['hicsail-hapi-mongo-models'].ReferenceExercise;
  const Exercise = server.plugins['hicsail-hapi-mongo-models'].Exercise;
  const User = server.plugins['hicsail-hapi-mongo-models'].User;

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

      //TODO:


      return reply(refExercise.bodyFrames);
    });
    }
  });

  // this route get the data from the latest version of reference for count reps
  server.route({
    method: 'GET',
    path: '/userexercise/smoothingtest/{exerciseId}/{patientId?}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
      }
    },
    handler: function (request, reply) {

      let smoothingResult;
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

          for (var i=0; i< reference.bodyFrames.length; ++i) {
            ref_impt_joint_X.push(reference.bodyFrames[i].joints[theJoint]["depthX"]);
            ref_impt_joint_Y.push(reference.bodyFrames[i].joints[theJoint]["depthY"]);
            ref_impt_joint_Z.push(reference.bodyFrames[i].joints[theJoint]["cameraZ"]);
          }
          console.log(ref_impt_joint_Y);

          function smooth(list, degree) {
            var win = degree*2-1;
            let weight = _.range(0, win).map(function (x) { return 1.0; });
            let weightGauss = [];
            for (i in _.range(0, win)) {
              i = i-degree+1;
              let frac = i/win;
              let gauss = 1 / Math.exp((4*(frac))*(4*(frac)));
              weightGauss.push(gauss);
            }
            weight = _(weightGauss).zip(weight).map(function (x) { return x[0]*x[1]; });
            let smoothed = _.range(0, (list.length+1)-win).map(function (x) { return 0.0; });
            for (i=0; i < smoothed.length; i++) {
              smoothed[i] = _(list.slice(i, i+win)).zip(weight).map(function (x) { return x[0]*x[1]; }).reduce(function (memo, num){ return memo + num; }, 0) / _(weight).reduce(function (memo, num){ return memo + num; }, 0);
            }
            return smoothed;
          }

          let ref_Y_smoothed = smooth(ref_impt_joint_Y, 5);
          console.log(ref_Y_smoothed);

          smoothingResult['t'] = _.range(ref_impt_joint_Y.length);
          smoothingResult['raw'] = ref_impt_joint_Y;
          smoothingResult['smoothed'] = ref_Y_smoothed;

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
      payload:{ maxBytes: 1048576 * 5 }
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
      payload:{ maxBytes: 1048576 * 5 }
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
      payload:{ maxBytes: 1048576 * 5 }
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
        findPracticeandUpdate: ['findPracticeExercise', function(results, done) {

          const query = {
            userId: patientId,
            exerciseId: request.params.exerciseId,
            referenceId: results.findMostRecentReference[0]._id.toString()
          };

          let requestPayload = request.payload;
          //TODO: currently only one joint is used for the accuracy
          //analysis
          let theJoint = results.findExercise.joint;
          let theAxis = results.findExercise.axis;
          let theDirection = results.findExercise.direction;

          let prac_impt_joint_X = []; //separate X,Y,Z for smoothing
          let prac_impt_joint_Y = [];
          let prac_impt_joint_Z = [];
          let prac_impt_joint; // the chosen axis
          let prac_impt_joint_XYZ = [];
          for (var i=0; i<requestPayload.bodyFrames.length; ++i) {
            prac_impt_joint_X.push(requestPayload.bodyFrames[i].joints[theJoint]["depthX"]);
            prac_impt_joint_Y.push(requestPayload.bodyFrames[i].joints[theJoint]["depthY"]);
            prac_impt_joint_Z.push(requestPayload.bodyFrames[i].joints[theJoint]["cameraZ"]);
          }

          let ref_impt_joint_X = [];
          let ref_impt_joint_Y = [];
          let ref_impt_joint_Z = [];
          let ref_impt_joint;
          let ref_impt_joint_XYZ = [];
          for (var i=0; i<results.findMostRecentReference[0].bodyFrames.length; ++i) {
            ref_impt_joint_X.push(results.findMostRecentReference[0].bodyFrames[i].joints[theJoint]["depthX"]);
            ref_impt_joint_Y.push(results.findMostRecentReference[0].bodyFrames[i].joints[theJoint]["depthY"]);
            ref_impt_joint_Z.push(results.findMostRecentReference[0].bodyFrames[i].joints[theJoint]["cameraZ"]);
          }

          //TODO: smoothing here
          let prac_impt_joint_X_smoothed = prac_impt_joint_X;
          let prac_impt_joint_Y_smoothed = prac_impt_joint_Y;
          let prac_impt_joint_Z_smoothed = prac_impt_joint_Z;
          for (var i=0; i<prac_impt_joint_X.length; ++i) {
            prac_impt_joint_XYZ.push([prac_impt_joint_X_smoothed[i],prac_impt_joint_Y_smoothed[i],prac_impt_joint_Z_smoothed[i]]);
          }
          let ref_impt_joint_X_smoothed = ref_impt_joint_X;
          let ref_impt_joint_Y_smoothed = ref_impt_joint_Y;
          let ref_impt_joint_Z_smoothed = ref_impt_joint_Z;
          for (var i=0; i<ref_impt_joint_X.length; ++i) {
            ref_impt_joint_XYZ.push([ref_impt_joint_X_smoothed[i],ref_impt_joint_Y_smoothed[i],ref_impt_joint_Z_smoothed[i]]);
          }


          //do we need to consider exercise moving in the Z?
          if (theAxis === "depthX") {
            prac_impt_joint = prac_impt_joint_X;
            ref_impt_joint = ref_impt_joint_X;
          } else if (theAxis === "depthY") {
            prac_impt_joint = prac_impt_joint_Y;
            ref_impt_joint = ref_impt_joint_Y;
          }

          //offline speed analysis, could also be used for segmentation
          let time_thresh = 30; // 1 sec
          let ifIncreased; // direction flag
          if(theDirection === 'L2R' || theDirection === 'down') {
            ifIncreased = true;
          } else if (theDirection === 'R2L' || theDirection === 'up') {
            ifIncreased = false;
          } else {
            console.log("You should not see this")
          }

          let prac_idx=[];
          for (var i=0; i<prac_impt_joint.length - 1; i++) {
            let v = prac_impt_joint[i+1] - prac_impt_joint[i];
            if(v >= 0) {
              if (ifIncreased) {
                prac_idx.push([i, true]); // true means moving in the same direction as the exercise
                // prac_idx.push([i, (v>=0) === ifIncreased]);
              } else {
                prac_idx.push([i, false]);
              }
            } else {
              if (ifIncreased) {
                prac_idx.push([i, false]);
              } else {
                prac_idx.push([i, true]);
              }
            }
          }
          let prac_st=[];
          let prac_ed=[];
          let timing = [];
          let ifFirst = true;
          for (var ii=0; ii<prac_idx.length-1; ii++) {
            if(prac_idx[ii][1] && ifFirst) {
              prac_st.push(prac_idx[ii][0]);
              ifFirst = false;
            } else if (prac_idx[ii][1] === false && prac_idx[ii+1][1]) {
              prac_ed.push(prac_idx[ii][0]);
              ifFirst = true;
            }
          }
          if (prac_idx[-1][1] === false) {
            prac_ed.push(prac_idx[-1][0]);
          }

          for (var j=0; j<prac_st.length; j++) {
            let delta = prac_ed[j] - prac_st[j];
            if(delta >= time_thresh) {
              timing.push(delta);
            }
          }
          console.log(timing);

          //TODO:same thing for reference exercise
          //TODO:but for now, we compare total time for speed analysis
          let prac_ttl;
          let n = requestPayload.repEvals.length; //number of reps
          for (var i=0; i<n; i++){
            prac_ttl += requestPayload.repEvals.speed;
          }
          let ref_ttl = results.findMostRecentReference[0].refTime;
          let msg_speed = "You have done " + n + " repititions for this set.\nIt takes you " + prac_ttl + " seconds to complete.\nYour reference time is " + ref_ttl + " seconds.\n"
          console.log(msg_speed);

          //dtw
          // 'squaredEuclidean' has been modified for >1 dimension
          // the other two ('manhattan' | 'euclidean') are for 1 dim only
          var dtw_impt_joint = new DTW('euclidean');
          var cost = dtw_impt_joint.compute(ref_impt_joint, prac_impt_joint);
          var path = dtw_impt_joint.path();
          let msg_dtw = "DTW (1 dim) cost: " + cost + '\n';
          console.log(msg_dtw);
          console.log("Path: ");
          console.log(path);

          var dtw_impt_joint_XYZ = new DTW('squaredEuclidean');

          var cost_XYZ = dtw_impt_joint_XYZ.compute(ref_impt_joint_XYZ, prac_impt_joint_XYZ);
          var path_XYZ = dtw_impt_joint_XYZ.path();
          let msg_dtw_XYZ = "DTW_XYZ cost: " + cost_XYZ + '\n';
          console.log(msg_dtw_XYZ);
          console.log("Path_XYZ: ");
          console.log(path_XYZ);

          let analysis = msg_speed + msg_dtw + msg_dtw_XYZ;

          let update = {
            $addToSet: {
              sets: {date: new Date(),
                onlineSpeed: requestPayload.repEvals,
                analysis: analysis,
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
                  analysis: analysis,
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
        return reply(results.findPracticeExercise.sets.analysis);
      }
      reply(false);
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
