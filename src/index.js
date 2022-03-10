'use strict';

const _ = require('lodash');
const axios = require('axios');
const childProcess = require('child_process');

class ServerlessDoppler {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.commands = {};
    this.hooks = { initialize: this.onInitialize.bind(this) };
    this.stage = this.getStage(serverless, options);
  }

  getStage(serverless, options) {
    return (
      _.get(options, 'stage') ||
      _.get(serverless, 'service.provider.stage') ||
      'dev'
    );
  }

  async onInitialize() {
    const property = this.getDopplerProperty();
    const environments = await this.getEnvironments(property);
    this.setEnvironments(environments);
  }

  setEnvironments(environments) {
    const path = 'service.provider.environment';
    const envs = _.get(this.serverless, path, {});
    this.serverless.cli.log('The environment variables below are applied.');
    Object.entries(environments).forEach(([key, value]) => {
      this.serverless.cli.log(`  - ${key}`);
      envs[key] = value;
    });

    _.set(this.serverless, path, envs);
  }

  async getEnvironments(property) {
    try {
      const { method, baseURL, url } = this.getInfoFromProperty(property);
      const params = this.getParamsFromProperty(property);
      const auth = this.getAuthFromProperty(property);
      const headers = this.getHeadersFromProperty();
      this.serverless.cli.log('Loading environment variables from Doppler...');
      const { data } = await axios({
        baseURL,
        method,
        params,
        auth,
        headers,
        url,
      });

      return data;
    } catch (err) {
      const message = _.get(err, 'response.data.messages[0]');
      if (!message) throw err;
      throw Error(message);
    }
  }

  getInfoFromProperty(property) {
    return {
      method: 'GET',
      baseURL: property.apiHost,
      url: '/v3/configs/config/secrets/download',
    };
  }

  getAuthFromProperty(property) {
    return { username: property.token };
  }

  getParamsFromProperty(property) {
    const format = 'json';
    const { project } = property;
    const config = property.config || this.stage;
    const include_dynamic_secrets = property.includeDynamicSecrets;
    return { project, config, include_dynamic_secrets, format };
  }

  getHeadersFromProperty() {
    return { 'User-Agent': 'serverless-doppler' };
  }

  getDopplerProperty() {
    const property = {
      apiHost: 'https://api.doppler.com',
      includeDynamicSecrets: true,
    };

    const propertyByCli = this.getDopplerPropertyByCli();
    const propertyByServerless = this.getDopplerPropertyByServerless();
    _.merge(property, propertyByCli, propertyByServerless);
    this.serverless.cli.log(
      `Loaded Doppler settings. (project: ${property.project}, config: ${property.config})`
    );

    return property;
  }

  getDopplerPropertyByCli() {
    const property = {};
    try {
      const command = 'doppler configure --json';
      const rawJson = childProcess.execSync(command);
      const json = JSON.parse(rawJson);
      Object.values(json).forEach((values) => _.merge(property, values));
    } catch (err) {}
    this.moveEnclaveToParent(property);
    return _.pick(property, 'apiHost', 'config', 'token', 'project');
  }

  moveEnclaveToParent(property) {
    const project = _.get(property, 'enclave.project');
    const config = _.get(property, 'enclave.config');
    _.merge(property, { project, config });
    return property;
  }

  getDopplerPropertyByServerless() {
    const property = _.get(this.serverless, 'service.custom.doppler', {});
    const apiHost = _.get(property, 'apiHost');
    const config = _.get(property, 'config');
    const token = _.get(property, 'token');
    const project = _.get(property, 'project');
    const includeDynamicSecrets = _.get(property, 'includeDynamicSecrets');
    return { apiHost, config, token, project, includeDynamicSecrets };
  }
}

module.exports = ServerlessDoppler;
