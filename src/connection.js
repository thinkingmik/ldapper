import _ from 'lodash';
import util from 'util';
import ldap from 'ldapjs';
import Promise from 'bluebird';
import LDAPConnectionError from './exceptions/ldapConnectionError';
import LDAPBindError from './exceptions/ldapBindError';

let connectClient = function (appconfig) {
  const dc = appconfig.domainControllers;
  let dcList = null;

  if (_.isNull(dc) || _.isUndefined(dc)) {
    dcList = [];
  }
  else if (!_.isArray(dc)) {
    dcList.push(dc);
  }
  else {
    dcList = dc;
  }

  return createConnection(dcList, 0, appconfig);
};

let createConnection = function (dcList, retry, appconfig) {
  retry = (_.isNull(retry) || _.isUndefined(retry)) ? 0 : retry;

  if (retry >= dcList.length) {
    const msg = util.format('Unable to connect to LDAP server: %s', JSON.stringify(dcList));
    return Promise.reject(new LDAPConnectionError(msg));
  }

  return connect(dcList[retry], appconfig)
    .catch(err => createConnection(dcList, retry + 1, appconfig));
}

let connect = function (dc, appconfig) {
  const protocol = (appconfig.ssl === true) ? 'ldaps://' : 'ldap://';
  const options = {
    url: protocol + dc,
    timeout: appconfig.timeout,
    connectTimeout: appconfig.connectTimeout,
    strictDN: appconfig.strictdn
  };

  return new Promise((resolve, reject) => {
    const client = ldap.createClient(options);
    client.on('connect', () => {
      Promise.promisifyAll(client);
      return resolve(client);
    });
    client.on('error', err => reject(err));
  });
}

let createClient = function (appconfig) {
  return connectClient(appconfig)
    .bind({})
    .then(function (client) {
      let self = this;
      self.client = client;
      return self.client.bindAsync(appconfig.root.dn, appconfig.root.password);
    })
    .then(function (res) {
      let self = this;
      return self.client;
    })
    .catch(function (err) {
      if (err instanceof LDAPConnectionError) {
        throw err;
      }
      throw new LDAPBindError(err);
    });
}

export default { createClient };