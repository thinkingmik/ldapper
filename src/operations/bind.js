import _ from 'lodash';
import Promise from 'bluebird';
import connectionManager from './../connection';
import searchManager from './search';
import LDAPAuthentiationError from '../exceptions/ldapAuthenticationError';
import LDAPUnbindError from '../exceptions/ldapUnbindError';

let checkAuthentication = function (password, searchDn, options, client, appconfig, autounbind) {
  return searchManager.search(searchDn, options, client, appconfig)
    .bind({})
    .then(function (entry) {
      let self = this;

      if (!_.isArray(entry) || entry.length === 0 || entry.length > 1 || _.isNull(password) || _.isUndefined(password) || _.isEmpty(password)) {
        return null;
      }

      return client.bindAsync(entry[0].dn, password)
        .then(res => entry[0])
        .catch(err => null);
    })
    .then(function (entry) {
      let self = this;
      self.result = entry;
      return self.result;
    })
    .catch(err => {
      throw new LDAPAuthentiationError(err);
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

export default { checkAuthentication };