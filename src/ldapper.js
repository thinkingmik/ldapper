import _ from 'lodash';
import util from 'util';
import { filters } from 'ldapjs';
import settings from './configs/appconfig';
import Configuration from './configuration';
import searchManager from './operations/search';
import modifyManager from './operations/modify';
import bindManager from './operations/bind';
import connectionManager from './connection';
import Helper from './helper';

class Ldapper {
  constructor(options) {
    this._config = new Configuration(options, settings);
  }

  //Expose ldapper public functions
  getConfig() {
    return this._config.getOptions();
  }

  /**
  * Search entries into ldap
  * @param {string} [filter]
  * @param {Array} [attributes]
  * @param {string} [searchScope]
  * @param {Object} [options]
  * @return {Promise<Array>}
  * @throws LDAPSearchError
  */
  find(filter, attributes, searchScope, options) {
    let opts = {};
    const appconfig = this._config.getOptions();
    opts['filter'] = (!_.isNull(filter) && !_.isUndefined(filter)) ? filter : appconfig.searchOptions.filter;
    opts['attributes'] = (!_.isNull(attributes) && !_.isUndefined(attributes)) ? attributes : appconfig.searchOptions.attributes;
    opts['scope'] = (!_.isNull(options) && !_.isUndefined(options) && !_.isNull(options.scope) && !_.isUndefined(options.scope)) ? options.scope : appconfig.searchOptions.scope;
    opts['sizeLimit'] = (!_.isNull(options) && !_.isUndefined(options) && !_.isNull(options.sizeLimit) && !_.isUndefined(options.sizeLimit)) ? options.sizeLimit : appconfig.searchOptions.sizeLimit;
    opts['paged'] = (!_.isNull(options) && !_.isUndefined(options) && !_.isNull(options.paged) && !_.isUndefined(options.paged)) ? options.paged : appconfig.searchOptions.paged;
    searchScope = (!_.isNull(searchScope) && !_.isUndefined(searchScope)) ? searchScope : appconfig.searchScope;

    return connectionManager.createClient(appconfig)
      .then(client => searchManager.search(searchScope, opts, client, appconfig, true));
  }

  /**
  * Get an entry from ldap
  * @param {string} dn
  * @param {Array} [attributes]
  * @param {Object} [options]
  * @return {Promise<Object>}
  * @throws LDAPSearchError
  */
  findOne(dn, attributes, options) {
    let opts = {};
    const appconfig = this._config.getOptions();
    opts['attributes'] = (!_.isNull(attributes) && !_.isUndefined(attributes)) ? attributes : appconfig.searchOptions.attributes;
    opts['scope'] = 'sub';
    opts['sizeLimit'] = 0;
    opts['paged'] = false;

    return connectionManager.createClient(appconfig)
      .then(client => searchManager.searchOne(dn, opts, client, appconfig, true));
  }

  /**
  * Get an entry from objectGuid
  * @param {string|Buffer} guid
  * @param {Array} [attributes]
  * @param {string} [searchScope]
  * @param {Object} [options]
  * @return {Promise<Object>}
  * @throws LDAPSearchError
  */
  findGuid(guid, attributes, searchScope, options) {
    let opts = {};
    const appconfig = this._config.getOptions();
    let buffer = null;
    if (Buffer.isBuffer(guid) === true || _.isNull(guid) || _.isUndefined(guid)) {
      buffer = guid;
    }
    else {
      const tmp = Helper.unformatGUID(guid);
      buffer = new Buffer(tmp, 'hex');
    }
    opts['filter'] = new filters.EqualityFilter({
      attribute: 'objectGuid',
      value: buffer
    });
    opts['attributes'] = (!_.isNull(attributes) && !_.isUndefined(attributes)) ? attributes : appconfig.searchOptions.attributes;
    opts['scope'] = 'sub';
    opts['sizeLimit'] = 0;
    opts['paged'] = false;
    searchScope = (!_.isNull(searchScope) && !_.isUndefined(searchScope)) ? searchScope : appconfig.searchScope;

    return connectionManager.createClient(appconfig)
      .then(client => searchManager.searchOne(searchScope, opts, client, appconfig, true));
  }

  /**
  * Get an entry from objectSid
  * @param {string|Buffer} sid
  * @param {Array} [attributes]
  * @param {string} [searchScope]
  * @param {Object} [options]
  * @return {Promise<Object>}
  * @throws LDAPSearchError
  */
  findSid(sid, attributes, searchScope, options) {
    let opts = {};
    const appconfig = this._config.getOptions();
    let buffer = null;
    if (Buffer.isBuffer(sid) === true || _.isNull(sid) || _.isUndefined(sid)) {
      buffer = sid;
    }
    else {
      const tmp = Helper.unformatSID(sid);
      buffer = new Buffer(tmp, 'hex');
    }
    opts['filter'] = new filters.EqualityFilter({
      attribute: 'objectSid',
      value: buffer
    });
    opts['attributes'] = (!_.isNull(attributes) && !_.isUndefined(attributes)) ? attributes : appconfig.searchOptions.attributes;
    opts['scope'] = 'sub';
    opts['sizeLimit'] = 0;
    opts['paged'] = false;
    searchScope = (!_.isNull(searchScope) && !_.isUndefined(searchScope)) ? searchScope : appconfig.searchScope;

    return connectionManager.createClient(appconfig)
      .then(client => searchManager.searchOne(searchScope, opts, client, appconfig, true));
  }

  /**
  * Add entry into ldap
  * @param {string} dn
  * @param {Object} [entry]
  * @return {Promise<bool>}
  * @throws LDAPAddError
  */
  add(dn, entry) {
    const appconfig = this._config.getOptions();
    if (!_.isNull(entry) && !_.isUndefined(entry)) {
      delete entry['dn'];
    }

    return connectionManager.createClient(appconfig)
      .then(client => modifyManager.add(dn, entry, client, appconfig, true));
  }

  /**
  * Change an entry into ldap
  * @param {string} dn
  * @param {Array|Object} changes
  * @return {Promise<Object>}
  * @throws LDAPChangeError
  */
  change(dn, changes) {
    const appconfig = this._config.getOptions();
    if (!_.isArray(changes)) {
      changes = [changes];
    }
    return connectionManager.createClient(appconfig)
      .then(client => modifyManager.change(dn, changes, client, appconfig, true));
  }

  /**
  * Rename an entry into ldap
  * @param {string} dn
  * @param {string} newDn
  * @return {Promise<bool>}
  * @throws LDAPRenameError
  */
  rename(dn, newDn) {
    const appconfig = this._config.getOptions();
    return connectionManager.createClient(appconfig)
      .then(client => modifyManager.rename(dn, newDn, client, appconfig, true));
  }

  /**
  * Delete an entry into ldap
  * @param {string} dn
  * @return {Promise<bool>}
  * @throws LDAPDeleteError
  */
  delete(dn) {
    const appconfig = this._config.getOptions();
    return connectionManager.createClient(appconfig)
      .then(client => modifyManager.remove(dn, client, appconfig, true));
  }

  /**
  * Validate user credentials on ldap
  * @param {string} username
  * @param {string} password
  * @param {Array|string} [authAttributes]
  * @param {Array|string} [retAttribute]
  * @param {string} [searchDn]
  * @return {Promise<Object>}
  * @throws LDAPAuthenticationError
  */
  authenticate(username, password, authAttributes, retAttribute, searchDn) {
    const opts = {};
    const appconfig = this._config.getOptions();
    let parts = '';
    if (_.isNull(authAttributes) || _.isUndefined(authAttributes) || (_.isArray(authAttributes) && authAttributes.length <= 0)) {
      authAttributes = ['uid']
    }
    else if (_.isString(authAttributes)) {
      authAttributes = [authAttributes];
    }
    _.each(authAttributes, attr => {
      const p = util.format('(%s=%s)', attr, username);
      parts += p;
    });
    const customFilter = util.format('(|%s)', parts);
    opts['filter'] = customFilter;
    opts['attributes'] = (!_.isNull(retAttribute) && !_.isUndefined(retAttribute)) ? retAttribute : 'dn';
    opts['scope'] = 'sub';
    searchDn = (!_.isNull(searchDn) && !_.isUndefined(searchDn)) ? searchDn : appconfig.searchScope;

    return connectionManager.createClient(appconfig)
      .then(client => bindManager.checkAuthentication(password, searchDn, opts, client, appconfig, true));
  }
}

export { Ldapper };

/* backward compatibility for ES5 'create' method: var ldapper = require('ldapper').create(); */
module.exports.create = function(options) {
  return new Ldapper(options);
};
