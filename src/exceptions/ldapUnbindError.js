module.exports = function LDAPUnbindError(err) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = 500;
  this.message = err.message || 'Error while unbinding user on LDAP';
};

require('util').inherits(module.exports, Error);
