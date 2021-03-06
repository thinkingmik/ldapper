module.exports = function LDAPConnectionError(err) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = 500;
  this.message = err.message || 'Error while connecting through LDAP';
};

require('util').inherits(module.exports, Error);
