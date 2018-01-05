import _ from 'lodash';
import Promise from 'bluebird';
import connectionManager from './../connection';
import LDAPUnbindError from '../exceptions/ldapUnbindError';
import LDAPSearchError from '../exceptions/ldapSearchError';
import helper from '../helper';

let search = function (searchDn, options, client, appconfig, autounbind) {
  return client.searchAsync(searchDn, options)
    .bind({})
    .then(search => new Promise((resolve, reject) => {
      let entryResult = [];
      search.on('searchEntry', entry => {
        const obj = entry.object;
        const raw = entry.raw;

        if (raw.hasOwnProperty('objectGUID')) {
          obj['objectGUID'] = helper.formatGUID(raw.objectGUID);
        }
        if (raw.hasOwnProperty('objectSid')) {
          obj['objectSid'] = helper.formatSID(raw.objectSid);
        }
        entryResult.push(obj);
      });
      search.on('error', err => reject(err));
      search.on('end', result => resolve(entryResult));
    }))
    .then(function (entries) {
      let self = this;
      self.result = entries;
      return self.result;
    })
    .catch(err => {
      throw new LDAPSearchError(err);
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

let searchOne = function (searchDn, options, client, appconfig, autounbind) {
  return search(searchDn, options, client, appconfig, autounbind)
    .then(entries => {
      let self = this;
      self.result = entries[0];
      return self.result;
    })
    .catch(err => {
      if (err.message == 'No Such Object') {
        return null;
      }
      throw err;
    });
}

export default { search, searchOne };