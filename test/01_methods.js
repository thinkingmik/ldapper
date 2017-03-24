var cheerio = require('cheerio')
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var Ldapper = require('../').Ldapper;
var Promise = require('bluebird');

var options = {
  domainControllers: [''],
  searchScope: '',
  tombstone: null,
  root: {
    dn: '',
    password: {
      crypton: true,
      value: ''
    }
  },
  crypton: {
    crypto: {
          secretKey: '',
          algorithm: 'AES-256-CBC',
          inputEncoding: 'utf8',
          outputEncoding: 'base64'
      },
      bcrypt: {
          saltRounds: 5
      }
  },
  ssl: false,
  timeout: null,
  connectTimeout: null,
  strictdn: false
};

var ldapper = new Ldapper(options);

describe('Call Crypton cipher method', function() {
  this.timeout(5000);
  it('should return a ciphered text', function() {
    return ldapper.find('(mail=*)', ['objectGUID'])
    .then(function(res) { console.log(res); expect(res).to.exist; })
    .catch(function(err) { console.log(err); });
  });
});

describe('Call Crypton cipher method', function() {
  this.timeout(5000);
  it('should return a ciphered text', function() {
    return ldapper.authenticate('', '')
    .then(function(res) { console.log(res); expect(res).to.exist; })
    .catch(function(err) { console.log(err); });
  });
});
