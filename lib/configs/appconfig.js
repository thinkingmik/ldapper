module.exports = {
  domainControllers: [],
  searchScope: null,
  searchOptions: {
      scope: 'sub',
      filter: '(objectclass=*)',
      attributes: [],
      sizeLimit: 0,
      paged: false
  },
  tombstone: null,
  root: {
      dn: null,
      password: {
          crypton: false,
          value: null
      }
  },
  crypton: null,
  ssl: false,
  timeout: null,
  connectTimeout: null,
  strictdn: false
}
