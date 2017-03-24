module.exports = function LDAPBindError(err) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = 500;
  this.message = err.message;
};

require('util').inherits(module.exports, Error);
