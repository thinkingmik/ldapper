var _ = require('lodash');
var util = require('util');
var ldap = require('ldapjs');
var Crypton = require('crypton').Crypton;
var Promise = require('bluebird');
var LDAPConnectionError = require('./exceptions/ldapConnectionError');
var LDAPBindError = require('./exceptions/ldapBindError');

var createClient = function (appconfig) {
  var dc = appconfig.domainControllers;
  var dcList = null;

  if (_.isNull(dc) || _.isUndefined(dc)) {
    dcList = [];
  }
  else if (!_.isArray(dc)) {
    dcList.push(dc);
  }
  else {
    dcList = dc;
  }

  return createConnection(dcList, 0, null, appconfig);
}

var createConnection = function (dcList, retry, err, appconfig) {
  retry = (_.isNull(retry) || _.isUndefined(retry)) ? 0 : retry;

  if (retry >= dcList.length) {
    var msg = util.format('Unable to connect to LDAP server: %s', JSON.stringify(dcList));
    return Promise.reject(new LDAPConnectionError(msg));
  }

  return connect(dcList[retry], appconfig)
  .catch(function (err) {
    return createConnection(dcList, retry + 1, err, appconfig);
  });
}

var connect = function (dc, appconfig) {
  var protocol = (appconfig.ssl === true) ? 'ldaps://' : 'ldap://';
  var options = {
    url: protocol + dc,
    timeout: appconfig.timeout,
    connectTimeout: appconfig.connectTimeout,
    strictDN: appconfig.strictdn
  };

  return new Promise(function (resolve, reject) {
    var client = ldap.createClient(options);
    client.on('connect', function () {
      Promise.promisifyAll(client);
      return resolve(client);
    });
    client.on('error', function (err) {
      return reject(err);
    });
  });
}

var createClientAndBind = function (appconfig) {
  return createClient(appconfig)
  .bind({})
  .then(function (client) {
    var self = this;
    self.client = client;
    var cryptoManager = new Crypton(appconfig.crypton);

    if (appconfig.root.password.crypton === true) {
      return cryptoManager.decipher(appconfig.root.password.value);
    }
    return appconfig.root.password.value;
  })
  .then(function (clearPassword) {
    var self = this;
    return self.client.bindAsync(appconfig.root.dn, clearPassword);
  })
  .then(function (res) {
    var self = this;
    return self.client;
  })
  .catch(function (err) {
    if (err instanceof LDAPConnectionError) {
      throw err;
    }
    throw new LDAPBindError(err);
  });
}

module.exports.createClient = createClientAndBind;
