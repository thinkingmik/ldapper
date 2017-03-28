var _ = require('lodash');
var util = require('util');
var ldap = require('ldapjs');
var Promise = require('bluebird');
var connectionManager = require('./../connection');
var searchManager = require('./search');
var LDAPUnbindError = require('../exceptions/ldapUnbindError');
var LDAPAddError = require('../exceptions/ldapAddError');
var LDAPDeleteError = require('../exceptions/ldapDeleteError');
var LDAPChangeError = require('../exceptions/ldapChangeError');
var LDAPRenameError = require('../exceptions/ldapRenameError');
var LDAPSearchError = require('../exceptions/ldapSearchError');

var addEntry = function (dn, entry, client, appconfig, autounbind) {
  return client.addAsync(dn, entry)
  .bind({})
  .then(function (res) {
    var self = this;
    entry['dn'] = dn;
    self.result = entry;
    return self.result;
  })
  .catch(function (err) {
    throw new LDAPAddError(err);
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

var deleteEntry = function (dn, client, appconfig, autounbind) {
  return client.delAsync(dn)
  .bind({})
  .then(function (res) {
    return true;
  })
  .catch(function(err) {
    if (err.message == 'No Such Object') {
      return false;
    }
    throw new LDAPDeleteError(err);
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

var changeDnEntry = function (dn, newDn, client, appconfig, autounbind) {
  return client.modifyDNAsync(dn, newDn)
  .bind({})
  .then(function (res) {
    return true;
  })
  .catch(function(err) {
    if (err.message == 'No Such Object') {
      return false;
    }
    throw new LDAPRenameError(err);
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

var changeEntry = function (dn, changes, client, appconfig, autounbind) {
  var opts = {};
  opts['attributes'] = [];
  opts['scope'] = 'sub';
  opts['sizeLimit'] = 0;
  opts['paged'] = false;

  return searchManager.searchOne(dn, opts, client, appconfig)
  .bind({})
  .then(function(entry) {
    if (_.isNull(entry)) {
      throw new LDAPSearchError(util.format('No Such Object %s', dn));
    }
    return entry;
  })
  .then(function(entry) {
    var self = this;
    self.ldapChanges = [];
    _.forEach(changes, function(change) {
      var operation = change['op']
      var attribute = change['attr'];
      var value = change['val'];

      if (!_.isUndefined(operation) && !_.isUndefined(attribute)) {
        var modifier = {};
        var op = 'add';

        switch(operation) {
          case 'append':
            modifier[attribute] = value;
            break;
          case 'write':
            if (!_.isNull(entry[attribute]) && !_.isUndefined(entry[attribute])) {
              op = 'replace';
            }
            modifier[attribute] = value;
            break;
          case 'delete':
            if (!_.isNull(entry[attribute]) && !_.isUndefined(entry[attribute])) {
              modifier[attribute] = entry[attribute];
            }
            op = 'delete';
            break;
        }
        if (!_.isEmpty(modifier)) {
          self.ldapChanges.push(new ldap.Change({
            operation: op,
            modification: modifier
          }));
        }
      }
    });
    return self.ldapChanges;
  })
  .then(function(ldapChanges) {
    return client.modifyAsync(dn, ldapChanges);
  })
  .then(function (res) {
    return searchManager.searchOne(dn, opts, client, appconfig)
  })
  .then(function (modEntry) {
    return modEntry;
  })
  .catch(function(err) {
    throw new LDAPChangeError(err);
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

module.exports.add = addEntry;
module.exports.delete = deleteEntry;
module.exports.rename = changeDnEntry;
module.exports.change = changeEntry;
