var cheerio = require('cheerio')
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var assert = chai.assert;
var Ldapper = require('../').Ldapper;
var Promise = require('bluebird');

var entry = {
  cn: 'test',
  sn: 'test',
  givenName: 'test',
  loginShell: 'test',
  displayName: 'test user',
  uid: 'test',
  uidNumber: '50623',
  gidNumber: '0',
  homeDirectory: '0',
  objectclass: ['inetOrgPerson', 'posixAccount']
};

var changes = [
  { op: 'add', attr: 'mail', val: 'test.01@acme.com' },
  { op: 'replace', attr: 'displayName', val: 'mr. test user' },
  { op: 'delete', attr: 'loginShell' }
]

var options = {
  domainControllers: ['192.168.99.100'],
  searchScope: 'ou=users,dc=acme,dc=com',
  root: {
    dn: 'cn=admin,dc=acme,dc=com',
    password: {
      crypton: false,
      value: 'admin'
    }
  },
  crypton: null,
  ssl: false,
  timeout: null,
  connectTimeout: null,
  strictdn: false
};

var ldapper = new Ldapper(options);

describe('Call ldapper find method', function() {
  this.timeout(5000);
  it('should return an array of entries', function() {
    return ldapper.find('(cn=*)', ['cn'])
    .then(function(res) {
      assert.isTrue(res.length > 0);
      expect(res).to.be.instanceof(Array);
      expect(res[0]).to.have.property('cn');
    });
  });
  it('should return an empty array', function() {
    return ldapper.find('(cn=testfake)')
    .then(function(res) {
      expect(res).to.be.instanceof(Array);
      assert.isTrue(res.length == 0);
    });
  });
  it('should return a LDAPSearchError', function() {
    return ldapper.find('(cn=*)', ['cn'], 'fakeDn')
    .catch(function(err) {
      expect(err.name).to.be.equal('LDAPSearchError');
    });
  });
});

describe('Call ldapper findOne method', function() {
  this.timeout(5000);
  it('should return an entry', function() {
    return ldapper.findOne('uid=joe,ou=users,dc=acme,dc=com', ['cn'])
    .then(function(res) {
      expect(res).to.not.be.null;
      expect(res).to.have.property('cn');
    });
  });
  it('should return null', function() {
    return ldapper.findOne('uid=fake,ou=users,dc=acme,dc=com', ['cn'])
    .then(function(res) {
      expect(res).to.be.null;
    });
  });
  it('should return a LDAPSearchError', function() {
    return ldapper.findOne('fakeDn', ['cn'])
    .catch(function(err) {
      expect(err.name).to.be.equal('LDAPSearchError');
    });
  });
});

describe('Call ldapper authenticate method', function() {
  this.timeout(5000);
  it('should return an entry', function() {
    return ldapper.authenticate('joe', 'Password1.', 'uid', 'cn')
    .then(function(res) {
      expect(res).to.not.be.null;
      expect(res).to.have.property('cn');
    });
  });
  it('should return null', function() {
    return ldapper.authenticate('joe', 'Password2.', 'uid', 'cn')
    .then(function(res) {
      expect(res).to.be.null;
    });
  });
  it('should return a LDAPAuthenticationError', function() {
    return ldapper.authenticate('joe', 'Password1.', 'uid', 'cn', 'fakeDn')
    .catch(function(err) {
      expect(err.name).to.be.equal('LDAPAuthenticationError');
    });
  });
});

describe('Call ldapper add method', function() {
  this.timeout(5000);
  it('should return a new entry', function() {
    return ldapper.add('uid=test,ou=users,dc=acme,dc=com', entry)
    .then(function(res) {
      expect(res).to.not.be.null;
      expect(res).to.have.property('dn');
    });
  });
  it('should return a LDAPAddError', function() {
    return ldapper.add('uid=test,ou=users,dc=acme,dc=org', entry)
    .catch(function(err) {
      expect(err.name).to.be.equal('LDAPAddError');
    });
  });
});

describe('Call ldapper change method', function() {
  this.timeout(5000);
  it('should return a modified entry', function() {
    return ldapper.change('uid=test,ou=users,dc=acme,dc=com', changes)
    .then(function(res) {
      expect(res).to.not.be.null;
      expect(res).to.have.property('dn');
    });
  });
  it('should return a LDAPChangeError', function() {
    return ldapper.change('uid=fake,ou=users,dc=acme,dc=com', changes)
    .catch(function(err) {
      expect(err.name).to.be.equal('LDAPChangeError');
    });
  });
});

describe('Call ldapper rename method', function() {
  this.timeout(5000);
  it('should return true', function() {
    return ldapper.rename('uid=test,ou=users,dc=acme,dc=com', 'uid=testNew,ou=users,dc=acme,dc=com')
    .then(function(res) {
      expect(res).to.not.be.null;
      expect(res).to.be.equal(true);
    });
  });
  it('should return false', function() {
    return ldapper.rename('uid=fake,ou=users,dc=acme,dc=com', 'uid=testNew,ou=users,dc=acme,dc=com')
    .then(function(res) {
      expect(res).to.not.be.null;
      expect(res).to.be.equal(false);
    });
  });
  it('should return a LDAPRenameError', function() {
    return ldapper.rename('uid=testNew,ou=users,dc=acme,dc=com', 'uid=testNew,ou=users,dc=acme,dc=com')
    .catch(function(err) {
      expect(err.name).to.be.equal('LDAPRenameError');
    });
  });
});

describe('Call ldapper delete method', function() {
  this.timeout(5000);
  it('should return true', function() {
    return ldapper.delete('uid=testNew,ou=users,dc=acme,dc=com')
    .then(function(res) {
      expect(res).to.not.be.null;
      expect(res).to.be.equal(true);
    });
  });
  it('should return false', function() {
    return ldapper.delete('uid=fake,ou=users,dc=acme,dc=com')
    .then(function(res) {
      expect(res).to.not.be.null;
      expect(res).to.be.equal(false);
    });
  });
  it('should return a LDAPDeleteError', function() {
    return ldapper.delete('uid=fake,ou=users,dc=acme,dc=org')
    .catch(function(err) {
      expect(err.name).to.be.equal('LDAPDeleteError');
    });
  });
});
