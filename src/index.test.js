'use strict';

const childProcess = require('child_process');
const ServerlessDoppler = require('.');
const { randomBytes } = require('crypto');

jest.mock('child_process');
describe('Check serverless-doppler plugin', () => {
  let plugin;
  beforeEach(() => {
    plugin = new ServerlessDoppler({
      cli: { log: console.log },
      service: { custom: { doppler: {} } },
    });
  });

  test('Get stage from default', () => {
    expect(plugin.getStage({}, {})).toBe('dev');
  });

  test('Get stage from options', () => {
    const stage = `${randomBytes(4).toString('hex')}`;
    const serverless = { service: { provider: {} } };
    const options = { stage };

    expect(plugin.getStage(serverless, options)).toBe(stage);
  });

  test('Get stage from serverless', () => {
    const stage = `${randomBytes(4).toString('hex')}`;
    const serverless = { service: { provider: { stage } } };
    const options = {};

    expect(plugin.getStage(serverless, options)).toBe(stage);
  });

  test('Set environments', () => {
    const environments = {};
    for (let i = 0; i < 10; i++) {
      const key = `${randomBytes(4).toString('hex')}`;
      environments[key] = key;
    }

    plugin.setEnvironments(environments);
    expect(plugin.serverless.service.provider.environment).toEqual(
      environments
    );
  });

  test('Get headers from property', () => {
    expect(plugin.getHeadersFromProperty()).toEqual({
      'User-Agent': 'serverless-doppler',
    });
  });

  test('Get info from property', () => {
    const property = { apiHost: `${randomBytes(4).toString('hex')}` };
    expect(plugin.getInfoFromProperty(property)).toEqual({
      method: 'GET',
      baseURL: property.apiHost,
      url: '/v3/configs/config/secrets/download',
    });
  });

  test('Get doppler property by Cli (Empty)', () => {
    childProcess.execSync.mockImplementation((command) => {
      expect(command).toEqual(`doppler configure --json`);
      return JSON.stringify({});
    });

    expect(plugin.getDopplerPropertyByCli()).toEqual({
      apiHost: undefined,
      config: undefined,
      token: undefined,
      project: undefined,
      includeDynamicSecrets: undefined,
    });
  });

  test('Get doppler property by Cli (With value)', () => {
    const customConfig = {
      apiHost: `${randomBytes(4).toString('hex')}`,
      config: `${randomBytes(4).toString('hex')}`,
      token: `${randomBytes(4).toString('hex')}`,
      project: `${randomBytes(4).toString('hex')}`,
    };

    childProcess.execSync.mockImplementation((command) => {
      expect(command).toEqual(`doppler configure --json`);
      return JSON.stringify({ '/': customConfig });
    });

    expect(plugin.getDopplerPropertyByCli()).toEqual(customConfig);
  });

  test('Move enclave to parent', () => {
    const project = `${randomBytes(4).toString('hex')}`;
    const config = `${randomBytes(4).toString('hex')}`;
    const customProperty = {
      'enclave.project': project,
      'enclave.config': config,
    };

    expect(plugin.moveEnclaveToParent(customProperty)).toEqual({
      ...customProperty,
      project,
      config,
    });
  });

  test('Get auth from property', () => {
    const token = `${randomBytes(4).toString('hex')}`;
    expect(plugin.getAuthFromProperty({ token })).toEqual({ username: token });
  });

  test('Get params from property', () => {
    const format = 'json';
    const project = `${randomBytes(4).toString('hex')}`;
    const config = `${randomBytes(4).toString('hex')}`;
    const includeDynamicSecrets = true;
    const customProperty = { project, config, includeDynamicSecrets };
    expect(plugin.getParamsFromProperty(customProperty)).toEqual({
      include_dynamic_secrets: includeDynamicSecrets,
      format,
      project,
      config,
    });
  });

  test('Get doppler property by Serverless (Empty)', () => {
    expect(plugin.getDopplerPropertyByServerless()).toEqual({
      apiHost: undefined,
      config: undefined,
      token: undefined,
      project: undefined,
      includeDynamicSecrets: undefined,
    });
  });

  test('Get doppler property by Serverless (With value)', () => {
    const customConfig = {
      apiHost: `${randomBytes(4).toString('hex')}`,
      config: `${randomBytes(4).toString('hex')}`,
      token: `${randomBytes(4).toString('hex')}`,
      project: `${randomBytes(4).toString('hex')}`,
      includeDynamicSecrets: true,
    };

    plugin.serverless.service.custom.doppler = customConfig;
    expect(plugin.getDopplerPropertyByServerless()).toEqual(customConfig);
  });
});
