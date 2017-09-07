var _ = require('lodash');
var Promise = require('bluebird');
var connectionManager = require('./../connection');
var LDAPUnbindError = require('../exceptions/ldapUnbindError');
var LDAPSearchError = require('../exceptions/ldapSearchError');
var helper = require('../helper');

var searchEntries = function (searchDn, options, client, appconfig, autounbind) {
  return client.searchAsync(searchDn, options)
  .bind({})
  .then(function (search) {
    return new Promise(function (resolve, reject) {
      var entryResult = [];
      search.on('searchEntry', function (entry) {
        var obj = entry.object;
        var raw = entry.raw;

        if (entry.raw.hasOwnProperty('objectGuid')) {
          obj['objectGuid'] = helper.formatGUID(raw.objectGUID);
        }
        if (entry.raw.hasOwnProperty('objectSid')) {
          console.log(raw.objectSid)
          obj['objectSid'] = helper.formatSID(raw.objectSid);
        }
        entryResult.push(obj);
      });
      search.on('error', function (err) {
        return reject(err);
      });
      search.on('end', function (result) {
        return resolve(entryResult);
      });
    });
  })
  .then(function (entries) {
    var self = this;
    self.result = entries;
    return self.result;
  })
  .catch(function (err) {
    throw new LDAPSearchError(err);
  })
  .finally(function() {
    if (autounbind === true) {
      return client.unbindAsync()
      .then(function() {
        return;
      })
      .catch(function(err) {
        throw new LDAPUnbindError(err);
      });
    }
  });
}

var searchEntry = function (searchDn, options, client, appconfig, autounbind) {
  return searchEntries(searchDn, options, client, appconfig, autounbind)
  .then(function (entries) {
    var self = this;
    self.result = entries[0];
    return self.result;
  })
  .catch(function(err) {
    if (err.message == 'No Such Object') {
      return null;
    }
    throw err;
  });
}

module.exports.search = searchEntries;
module.exports.searchOne = searchEntry;
