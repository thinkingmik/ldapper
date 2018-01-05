import _ from 'lodash';
import util from 'util';
import ldap from 'ldapjs';
import Promise from 'bluebird';
import connectionManager from './../connection';
import searchManager from './search';
import LDAPUnbindError from '../exceptions/ldapUnbindError';
import LDAPAddError from '../exceptions/ldapAddError';
import LDAPDeleteError from '../exceptions/ldapDeleteError';
import LDAPChangeError from '../exceptions/ldapChangeError';
import LDAPRenameError from '../exceptions/ldapRenameError';
import LDAPSearchError from '../exceptions/ldapSearchError';

let add = function (dn, entry, client, appconfig, autounbind) {
  return client.addAsync(dn, entry)
    .bind({})
    .then(res => {
      let self = this;
      entry['dn'] = dn;
      self.result = entry;
      return self.result;
    })
    .catch(err => {
      throw new LDAPAddError(err);
    })
    .finally(() => {
      if (autounbind === true) {
        return client.unbindAsync()
          .then(() => {
            return;
          })
          .catch(err => {
            throw new LDAPUnbindError(err);
          });
      }
    });
}

let remove = function (dn, client, appconfig, autounbind) {
  return client.delAsync(dn)
    .bind({})
    .then(res => true)
    .catch(err => {
      if (err.message == 'No Such Object') {
        return false;
      }
      throw new LDAPDeleteError(err);
    })
    .finally(() => {
      if (autounbind === true) {
        return client.unbindAsync()
          .then(() => {
            return;
          })
          .catch(err => {
            throw new LDAPUnbindError(err);
          });
      }
    });
}

let rename = function (dn, newDn, client, appconfig, autounbind) {
  return client.modifyDNAsync(dn, newDn)
    .bind({})
    .then(res => true)
    .catch(err => {
      if (err.message == 'No Such Object') {
        return false;
      }
      throw new LDAPRenameError(err);
    })
    .finally(() => {
      if (autounbind === true) {
        return client.unbindAsync()
          .then(() => {
            return;
          })
          .catch(err => {
            throw new LDAPUnbindError(err);
          });
      }
    });
}

let change = function (dn, changes, client, appconfig, autounbind) {
  const opts = {};
  opts['attributes'] = [];
  opts['scope'] = 'sub';
  opts['sizeLimit'] = 0;
  opts['paged'] = false;

  return searchManager.searchOne(dn, opts, client, appconfig)
    .bind({})
    .then(entry => {
      if (_.isNull(entry)) {
        throw new LDAPSearchError(util.format('No Such Object %s', dn));
      }
      return entry;
    })
    .then(function (entry) {
      let self = this;
      self.ldapChanges = [];
      _.forEach(changes, change => {
        const operation = change['op'];
        const attribute = change['attr'];
        const value = change['val'];

        if (!_.isUndefined(operation) && !_.isUndefined(attribute)) {
          const modifier = {};
          let op = 'add';

          if (operation === 'append') {
            modifier[attribute] = (!_.isNull(value) && !_.isUndefined(value)) ? value : '';
            if (_.isNull(entry[attribute]) || !_.isUndefined(entry[attribute])) {
              op = 'add';
            }
            self.ldapChanges.push(new ldap.Change({
              operation: op,
              modification: modifier
            }));
          }
          else if (operation === 'write') {
            modifier[attribute] = (!_.isNull(value) && !_.isUndefined(value)) ? value : '';
            if (!_.isNull(entry[attribute]) && !_.isUndefined(entry[attribute])) {
              op = 'replace';
            }
            self.ldapChanges.push(new ldap.Change({
              operation: op,
              modification: modifier
            }));
          }
          else if (operation === 'delete') {
            let partial = [];
            op = 'delete';
            if (_.isUndefined(value) && !_.isNull(entry[attribute]) && !_.isUndefined(entry[attribute]) && !_.isArray(entry[attribute])) {
              modifier[attribute] = entry[attribute];
              partial.push(new ldap.Change({
                operation: op,
                modification: modifier
              }));
            }
            else if (_.isUndefined(value) && !_.isNull(entry[attribute]) && !_.isUndefined(entry[attribute]) && _.isArray(entry[attribute])) {
              _.forEach(entry[attribute], partialValue => {
                const partialModifier = {};
                partialModifier[attribute] = partialValue;
                partial.push(new ldap.Change({
                  operation: op,
                  modification: partialModifier
                }));
              });
            }
            else if (!_.isUndefined(value)) {
              modifier[attribute] = value;
              partial.push(new ldap.Change({
                operation: op,
                modification: modifier
              }));
            }

            _.forEach(partial, elem => {
              self.ldapChanges.push(elem);
            });
          }
        }
      });
      return self.ldapChanges;
    })
    .then(ldapChanges => {
      if (ldapChanges.length > 0) {
        return client.modifyAsync(dn, ldapChanges);
      }
    })
    .then(res => searchManager.searchOne(dn, opts, client, appconfig))
    .then(modEntry => modEntry)
    .catch(err => {
      throw new LDAPChangeError(err);
    })
    .finally(() => {
      if (autounbind === true) {
        return client.unbindAsync()
          .then(() => {
            return;
          })
          .catch(err => {
            throw new LDAPUnbindError(err);
          });
      }
    });
}

export default { add, remove, rename, change };
