module.exports = function LDAPSearchError(err) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = 500;
  this.message = err.message || 'Error while searching LDAP entry';
};

require('util').inherits(module.exports, Error);
