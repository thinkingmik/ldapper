var _ = require('lodash');
var Promise = require('bluebird');
var connectionManager = require('./../connection');
var searchManager = require('./search');
var LDAPConnectionError = require('../exceptions/ldapConnectionError');
var LDAPBindError = require('../exceptions/ldapBindError');
var LDAPUnbindError = require('../exceptions/ldapUnbindError');
var LDAPSearchError = require('../exceptions/ldapSearchError');

var checkAuthentication = function (password, searchDn, options, client, appconfig, autoclose) {
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
  .then(function(res) {
    if (autoclose === true) {
      return client.unbindAsync()
      .then(function() {
        return res;
      })
      .catch(function(err) {
        throw new LDAPUnbindError(err);
      });
    }
    return res;
  })
  .catch(function(err) {
    if (err instanceof LDAPBindError) {
      throw err;
    }
    else if (err instanceof LDAPUnbindError) {
      throw err;
    }
    throw new LDAPBindError(err);
  });
}

module.exports.checkAuthentication = checkAuthentication;
