var _ = require('lodash');
var Promise = require('bluebird');
var connectionManager = require('./../connection');
var searchManager = require('./search');
var LDAPAuthentiationError = require('../exceptions/ldapAuthenticationError');
var LDAPUnbindError = require('../exceptions/ldapUnbindError');

var checkAuthentication = function (password, searchDn, options, client, appconfig, autounbind) {
  return searchManager.search(searchDn, options, client, appconfig)
  .bind({})
  .then(function (entry) {
    var self = this;

    if (!_.isArray(entry) || entry.length === 0 || entry.length > 1 || _.isNull(password) || _.isUndefined(password) || _.isEmpty(password)) {
      return null;
    }

    return client.bindAsync(entry[0].dn, password)
    .then(function(res) {
      return entry[0];
    })
    .catch(function(err) {
      return null;
    });
  })
  .then(function(entry) {
    var self = this;
    self.result = entry;
    return self.result;
  })
  .catch(function(err) {
    throw new LDAPAuthentiationError(err);
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

module.exports.checkAuthentication = checkAuthentication;
