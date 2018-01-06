import cheerio from 'cheerio';
import chai from 'chai';
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;
import { Ldapper } from '../dist/ldapper';
import Promise from 'bluebird';

const entry = {
  cn: 'test',
  sn: 'test',
  givenName: 'test',
  loginShell: 'test',
  displayName: 'test user',
  uid: 'test',
  uidNumber: '50623',
  gidNumber: '0',
  homeDirectory: '0',
  userPassword: 'Password1.',
  objectclass: ['inetOrgPerson', 'posixAccount', 'top']
};

const changes = [
  { op: 'write', attr: 'mail', val: 'test.01@acme.com' },
  { op: 'append', attr: 'mail', val: 'test.02@acme.com' },
  { op: 'append', attr: 'mail', val: 'test.03@acme.com' },
  { op: 'delete', attr: 'loginShell' }
];

const options = {
  domainControllers: ['192.168.1.145', '192.168.99.100'],
  searchScope: 'ou=users,dc=acme,dc=com',
  root: {
    dn: 'cn=admin,dc=acme,dc=com',
    password: 'admin'
  },
  ssl: false,
  timeout: null,
  connectTimeout: null,
  strictdn: false
};

let ldapper = new Ldapper(options);

describe('Call ldapper find method', function () {
  this.timeout(5000);
  it('should return an array of entries', () => ldapper.find('(cn=*)', ['cn'])
    .then(res => {
      assert.isTrue(res.length > 0);
      expect(res).to.be.instanceof(Array);
      expect(res[0]).to.have.property('cn');
    }));
  it('should return an empty array', () => ldapper.find('(cn=testfake)')
    .then(res => {
      expect(res).to.be.instanceof(Array);
      assert.isTrue(res.length == 0);
    }));
  it('should return a LDAPSearchError', () => ldapper.find('(cn=*)', ['cn'], 'fakeDn')
    .catch(err => {
      expect(err.name).to.be.equal('LDAPSearchError');
    }));
});

describe('Call ldapper findOne method', function () {
  this.timeout(5000);
  it('should return an entry', () => ldapper.findOne('cn=admin,ou=users,dc=acme,dc=com', ['cn'])
    .then(res => {
      expect(res).to.not.be.null;
      expect(res).to.have.property('cn');
    }));
  it('should return null', () => ldapper.findOne('cn=fake,ou=users,dc=acme,dc=com', ['cn'])
    .then(res => {
      expect(res).to.be.null;
    }));
  it('should return a LDAPSearchError', () => ldapper.findOne('fakeDn', ['cn'])
    .catch(err => {
      expect(err.name).to.be.equal('LDAPSearchError');
    }));
});

describe('Call ldapper authenticate method', function () {
  this.timeout(5000);
  it('should return an entry', () => ldapper.authenticate('admin', 'admin', 'cn', 'cn')
    .then(res => {
      expect(res).to.not.be.null;
      expect(res).to.have.property('cn');
    }));
  it('should return null', () => ldapper.authenticate('admin', 'Password2.', 'cn', 'cn')
    .then(res => {
      expect(res).to.be.null;
    }));
  it('should return a LDAPAuthenticationError', () => ldapper.authenticate('admin', 'admin', 'cn', 'cn', 'fakeDn')
    .catch(err => {
      expect(err.name).to.be.equal('LDAPAuthenticationError');
    }));
});

describe('Call ldapper add method', function () {
  this.timeout(5000);
  it('should return a new entry', () => ldapper.add('cn=test,ou=users,dc=acme,dc=com', entry)
    .then(res => {
      expect(res).to.not.be.null;
      expect(res).to.have.property('dn');
    }));
  it('should return a LDAPAddError', () => ldapper.add('cn=test,ou=users,dc=acme,dc=org', entry)
    .catch(err => {
      expect(err.name).to.be.equal('LDAPAddError');
    }));
});

describe('Call ldapper change method', function () {
  this.timeout(5000);
  it('should return a modified entry', () => ldapper.change('cn=test,ou=users,dc=acme,dc=com', changes)
    .then(res => {
      expect(res).to.not.be.null;
      expect(res).to.have.property('dn');
    }));
  it('should return a LDAPChangeError', () => ldapper.change('cn=fake,ou=users,dc=acme,dc=com', changes)
    .catch(err => {
      expect(err.name).to.be.equal('LDAPChangeError');
    }));
});

describe('Call ldapper rename method', function () {
  this.timeout(5000);
  it('should return true', () => ldapper.rename('cn=test,ou=users,dc=acme,dc=com', 'cn=testNew,ou=users,dc=acme,dc=com')
    .then(res => {
      expect(res).to.not.be.null;
      expect(res).to.be.equal(true);
    }));
  it('should return false', () => ldapper.rename('cn=fake,ou=users,dc=acme,dc=com', 'cn=testNew,ou=users,dc=acme,dc=com')
    .then(res => {
      expect(res).to.not.be.null;
      expect(res).to.be.equal(false);
    }));
  it('should return a LDAPRenameError', () => ldapper.rename('cn=testNew,ou=users,dc=acme,dc=com', 'cn=testNew,ou=users,dc=acme,dc=com')
    .catch(err => {
      expect(err.name).to.be.equal('LDAPRenameError');
    }));
});

describe('Call ldapper delete method', function () {
  this.timeout(5000);
  it('should return true', () => ldapper.delete('cn=testNew,ou=users,dc=acme,dc=com')
    .then(res => {
      expect(res).to.not.be.null;
      expect(res).to.be.equal(true);
    }));
  it('should return false', () => ldapper.delete('cn=fake,ou=users,dc=acme,dc=com')
    .then(res => {
      expect(res).to.not.be.null;
      expect(res).to.be.equal(false);
    }));
  it('should return a LDAPDeleteError', () => ldapper.delete('cn=fake,ou=users,dc=acme,dc=org')
    .catch(err => {
      expect(err.name).to.be.equal('LDAPDeleteError');
    }));
});