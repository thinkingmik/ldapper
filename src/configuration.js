import _ from 'lodash';

class Configuration {
  constructor(options, settings) {
    this._config = _.clone(settings, true);
    if (_.isNull(options) || _.isUndefined(options)) {
      return;
    }

    this._config['domainControllers'] = this.selectConfigValue(options['domainControllers'], this._config['domainControllers']);
    this._config['searchScope'] = this.selectConfigValue(options['searchScope'], this._config['searchScope']);
    this._config['ssl'] = this.selectConfigValue(options['ssl'], this._config['ssl']);
    this._config['timeout'] = this.selectConfigValue(options['timeout'], this._config['timeout']);
    this._config['connectTimeout'] = this.selectConfigValue(options['connectTimeout'], this._config['connectTimeout']);
    this._config['strictdn'] = this.selectConfigValue(options['strictdn'], this._config['strictdn']);

    if (!_.isNull(options.searchOptions) && !_.isUndefined(options.searchOptions)) {
      this._config.searchOptions['scope'] = this.selectConfigValue(options.searchOptions['scope'], this._config.searchOptions['scope']);
      this._config.searchOptions['filter'] = this.selectConfigValue(options.searchOptions['filter'], this._config.searchOptions['filter']);
      this._config.searchOptions['attributes'] = this.selectConfigValue(options.searchOptions['attributes'], this._config.searchOptions['attributes']);
      this._config.searchOptions['sizeLimit'] = this.selectConfigValue(options.searchOptions['sizeLimit'], this._config.searchOptions['sizeLimit']);
      this._config.searchOptions['paged'] = this.selectConfigValue(options.searchOptions['paged'], this._config.searchOptions['paged']);
    }

    if (!_.isNull(options.root) && !_.isUndefined(options.root)) {
      this._config.root['dn'] = this.selectConfigValue(options.root['dn'], this._config.root['dn']);
      this._config.root['password'] = this.selectConfigValue(options.root['password'], this._config.root['password']);
    }
  }

  getOptions() {
    return this._config;
  }

  selectConfigValue(custom, def) {
    if (_.isNull(custom) || _.isUndefined(custom) || (_.isArray(custom) && custom.length <= 0)) {
      return def;
    }
    return custom;
  }
}

export default Configuration;
