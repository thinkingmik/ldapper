var _ = require('lodash');

function Configuration(options, settings) {
  this._config = _.clone(settings, true);
  if (_.isNull(options) || _.isUndefined(options)) {
    return;
  }

  this._config['domainControllers'] = selectConfigValue(options['domainControllers'], this._config['domainControllers']);
  this._config['searchScope'] = selectConfigValue(options['searchScope'], this._config['searchScope']);
  this._config['tombstone'] = selectConfigValue(options['tombstone'], this._config['tombstone']);
  this._config['ssl'] = selectConfigValue(options['ssl'], this._config['ssl']);
  this._config['timeout'] = selectConfigValue(options['timeout'], this._config['timeout']);
  this._config['connectTimeout'] = selectConfigValue(options['connectTimeout'], this._config['connectTimeout']);
  this._config['strictdn'] = selectConfigValue(options['strictdn'], this._config['strictdn']);
  this._config['crypton'] = selectConfigValue(options['crypton'], this._config['crypton']);

  if (!_.isNull(options.searchOptions) && !_.isUndefined(options.searchOptions)) {
    this._config.searchOptions['scope'] = selectConfigValue(options.searchOptions['scope'], this._config.searchOptions['scope']);
    this._config.searchOptions['filter'] = selectConfigValue(options.searchOptions['filter'], this._config.searchOptions['filter']);
    this._config.searchOptions['attributes'] = selectConfigValue(options.searchOptions['attributes'], this._config.searchOptions['attributes']);
    this._config.searchOptions['sizeLimit'] = selectConfigValue(options.searchOptions['sizeLimit'], this._config.searchOptions['sizeLimit']);
    this._config.searchOptions['paged'] = selectConfigValue(options.searchOptions['paged'], this._config.searchOptions['paged']);
  }

  if (!_.isNull(options.root) && !_.isUndefined(options.root)) {
    this._config.root['dn'] = selectConfigValue(options.root['dn'], this._config.root['dn']);

    if (!_.isNull(options.root.password) && !_.isUndefined(options.root.password)) {
      this._config.root.password['crypton'] = selectConfigValue(options.root.password['crypton'], this._config.root.password['crypton']);
      this._config.root.password['value'] = selectConfigValue(options.root.password['value'], this._config.root.password['value']);
    }
  }
}

Configuration.prototype.getOptions = function() {
  return this._config;
}

var selectConfigValue = function(custom, def) {
  if (_.isNull(custom) || _.isUndefined(custom) || (_.isArray(custom) && custom.length <= 0)) {
    return def;
  }
  return custom;
}

exports = module.exports = Configuration;
