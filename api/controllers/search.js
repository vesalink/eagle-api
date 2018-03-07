var auth        = require("../helpers/auth");
var _           = require('lodash');
var defaultLog  = require('winston').loggers.get('default');
var mongoose    = require('mongoose');
var Actions     = require('../helpers/actions');
var request     = require('request');

exports.protectedOptions = function (args, res, rest) {
  res.status(200).send();
}

exports.publicGetBCGW = function (args, res, next) {
  // Build match query if on appId route
  var clFile = args.swagger.params.crownLandsId.value;
  defaultLog.info("Searching BCGW for CLFILE:", clFile);

  // TODO: Error handling.

  // var searchURL = "https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_CROWN_TENURES_SVW/ows?service=wfs&version=2.0.0&request=getfeature&typename=pub:WHSE_TANTALIS.TA_CROWN_TENURES_SVW&outputFormat=application/json&PROPERTYNAME=CROWN_LANDS_FILE&CQL_FILTER=CROWN_LANDS_FILE=";
  var searchURL = "https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_CROWN_TENURES_SVW/ows?service=wfs&version=2.0.0&request=getfeature&typename=PUB:WHSE_TANTALIS.TA_CROWN_TENURES_SVW&outputFormat=json&srsName=EPSG:4326&CQL_FILTER=CROWN_LANDS_FILE=";
  console.log("SEARCHING:", searchURL+ "'" + clFile + "'");
  return new Promise(function (resolve, reject) {
    request({url: searchURL + "'" + clFile + "'"}, function (err, res, body) {
      if (err) {
        reject(err);
      } else if (res.statusCode !== 200) {
        reject(res.statusCode+' '+body);
      } else {
        defaultLog.info ('BCGW Call Complete.', body);
        var obj = JSON.parse(body);
        // Search for this in our DB in case it's been imported in an application.
        try {
          var result = _.chain(obj.features)
          .groupBy("properties.DISPOSITION_TRANSACTION_SID")
          .toPairs()
          .map(function(currentItem) {
              return _.zipObject(["SID", "sids"], currentItem);
          })
          .value();

          obj.sidsFound = [];
          result.reduce (function (current, code) {
            return current.then (function () {
                // console.log ('+++++++++', code.SID);
                var Application = require('mongoose').model('Application');
                return Application.findOne({cl_files: { "$in":[clFile]},  tantalisID: code.SID}, function (err, o) {
                if (o) {
                  obj.sidsFound.push(code.SID);
                } else {
                  console.log("Nothing found");
                }
              });
            });
          }, Promise.resolve())
          .then(function () {
            resolve(obj);
          });
        } catch (e) {
          // Error, don't tag the isImported on it.
          resolve(obj);
        }
      }
    });
  }).then(function (data) {
    return Actions.sendResponse(res, 200, data);
  }).catch(function (err) {
    defaultLog.error (err);
    return Actions.sendResponse(res, 400, err);
  });
};

exports.publicGetBCGWDispositionTransactionId = function (args, res, next) {
  // Build match query if on appId route
  var dtId = args.swagger.params.dtId.value;
  defaultLog.info("Searching BCGW for Disposition Transaction ID:", dtId);

  // TODO: Error handling.

  var searchURL = "https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_CROWN_TENURES_SVW/ows?service=wfs&version=2.0.0&request=getfeature&typename=PUB:WHSE_TANTALIS.TA_CROWN_TENURES_SVW&outputFormat=json&srsName=EPSG:4326&CQL_FILTER=DISPOSITION_TRANSACTION_SID=";
  return new Promise(function (resolve, reject) {
    request({url: searchURL + "'" + dtId + "'"}, function (err, res, body) {
      if (err) {
        reject(err);
      } else if (res.statusCode !== 200) {
        reject(res.statusCode+' '+body);
      } else {
        defaultLog.info ('BCGW Call Complete.', body);
        resolve(JSON.parse(body));
      }
    });
  }).then(function (data) {
    return Actions.sendResponse(res, 200, data);
  }).catch(function (err) {
    defaultLog.error (err);
    return Actions.sendResponse(res, 400, err);
  });
};
