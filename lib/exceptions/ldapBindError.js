module.exports = function LDAPBindError(err) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = 500;
  this.message = err.message || 'Error while binding user on LDAP';
};

require('util').inherits(module.exports, Error);
