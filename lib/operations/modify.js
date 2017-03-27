var _ = require('lodash');
var ldap = require('ldapjs');
var Promise = require('bluebird');
var connectionManager = require('./../connection');
var searchManager = require('./search');
var LDAPUnbindError = require('../exceptions/ldapUnbindError');
var LDAPAddError = require('../exceptions/ldapAddError');
var LDAPDeleteError = require('../exceptions/ldapDeleteError');
var LDAPChangeError = require('../exceptions/ldapChangeError');
var LDAPRenameError = require('../exceptions/ldapRenameError');

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
  return Promise.resolve(true)
  .bind({})
  .then(function() {
    var self = this;
    self.ldapChanges = [];
    _.forEach(changes, function(change) {
      if (!_.isUndefined(change['op']) && !_.isUndefined(change['attr'])) {
        var mod = {};
        mod[change['attr']] = change['val'];
        var obj = {
          operation: change['op'],
          modification: mod
        };
        self.ldapChanges.push(new ldap.Change(obj));
      }
    });
    return self.ldapChanges;
  })
  .then(function(ldapChanges) {
    return client.modifyAsync(dn, ldapChanges);
  })
  .then(function (res) {
    return true;
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
