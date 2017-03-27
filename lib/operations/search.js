var _ = require('lodash');
var binary = require('binary');
var Promise = require('bluebird');
var connectionManager = require('./../connection');
var LDAPUnbindError = require('../exceptions/ldapUnbindError');
var LDAPSearchError = require('../exceptions/ldapSearchError');

var searchEntries = function (searchDn, options, client, appconfig, autounbind) {
  return client.searchAsync(searchDn, options)
  .bind({})
  .then(function (search) {
    return new Promise(function (resolve, reject) {
      var entryResult = [];
      search.on('searchEntry', function (entry) {
        var obj = entry.object;
        var raw = entry.raw;

        if (entry.raw.hasOwnProperty('objectGUID')) {
          obj['objectGUID'] = formatGUID(raw.objectGUID);
        }
        if (entry.raw.hasOwnProperty('objectSid')) {
          obj.objectSid = formatSID(raw.objectSid);
        }
        entryResult.push(obj);
      });
      search.on('error', function (err) {
        return reject(err);
      });
      search.on('end', function (result) {
        return resolve(entryResult);
      });
    });
  })
  .then(function (entries) {
    var self = this;
    self.result = entries;
    return self.result;
  })
  .catch(function (err) {
    throw new LDAPSearchError(err);
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

var searchEntry = function (searchDn, options, client, appconfig, autounbind) {
  return searchEntries(searchDn, options, client, appconfig, autounbind)
  .then(function (entries) {
    var self = this;
    self.result = entries[0];
    return self.result;
  })
  .catch(function(err) {
    if (err.message == 'No Such Object') {
      return null;
    }
    throw err;
  });
}

var formatSID = function (buf) {
  var parser = binary.parse(buf)
  .word8lu('version')
  .word8lu('fields')
  .buffer('type', 6)
  .loop(function (end, vars) {
    vars.sid = vars.sid || new Array();
    vars.sid.push(this.word32lu('sid_field').vars.sid_field);
    if (vars.sid.length >= vars.fields) {
      end();
    }
  });
  var version = parser.vars.version;
  var type = parser.vars.type;
  var domsid = parser.vars.sid;
  var output = ['S', version, outputSidType(type)].concat(domsid).join('-');
  return output;
}

var outputSidType = function (type) {
  var buf = new Buffer(6);
  var output = 0;
  type.copy(buf, 0);
  for (var i = 0; i < 6; i++) {
    output = output << 8;
    output = output | buf[i];
  }
  return output;
}

var formatGUID = function (objectGUID) {
  var data = new Buffer(objectGUID, 'binary');
  var template = '{3}{2}{1}{0}-{5}{4}-{7}{6}-{8}{9}-{10}{11}{12}{13}{14}{15}';
  for (var i = 0; i < data.length; i++) {
    var dataStr = data[i].toString(16);
    dataStr = data[i] >= 16 ? dataStr : '0' + dataStr;
    template = template.replace(new RegExp('\\{' + i + '\\}', 'g'), dataStr);
  }
  return template;
}

module.exports.search = searchEntries;
module.exports.searchOne = searchEntry;
