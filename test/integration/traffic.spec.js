import chai from 'chai';
import chaiSubset from 'chai-subset';
import Promise from 'bluebird';
import WebSocket from 'ws';
import Qix from '../../src/qix';
import Schema from '../../schemas/qix/3.2/schema.json';
import utils from './utils';

chai.use(chaiSubset);

describe('qix-logging', () => {
  let qixGlobal;
  // let isServer = true;
  const config = {};
  let sandbox;
  before(() =>
    utils.getDefaultConfig().then((defaultConfig) => {
      sandbox = sinon.sandbox.create();
      // isServer = defaultConfig.isServer;
      config.session = defaultConfig.session;
      config.session.route = 'app/engineData';
      config.Promise = Promise;
      config.schema = Schema;
      config.listeners = {
        'traffic:sent': sinon.spy(),
        'traffic:received': sinon.spy(),
        'traffic:*': sinon.spy(),
      };
      config.createSocket = url =>
      new WebSocket(url, defaultConfig.socket);

      return Qix.connect(config).then((g) => {
        qixGlobal = g.global;
      });
    })
  );

  after(() => {
    sandbox.restore();
    qixGlobal.session.on('error', () => {}); // Swallow the error
    return qixGlobal.session.close();
  });

  it('should log qix traffic', () => {
    qixGlobal.allowCreateApp().then(() => {
      const request = {
        method: 'AllowCreateApp',
        handle: -1,
        params: [],
        delta: false,
        outKey: -1,
        id: 1,
      };
      const response = {
        id: 1,
        jsonrpc: '2.0',
        result: {
          qReturn: true,
        },
      };
      expect(config.listeners['traffic:sent'].firstCall.args[0]).to.containSubset(request);
      expect(config.listeners['traffic:received'].firstCall.args[0]).to.containSubset(response);
      expect(config.listeners['traffic:*'].firstCall.args[0]).to.equal('sent');
      expect(config.listeners['traffic:*'].firstCall.args[1]).to.containSubset(request);
      expect(config.listeners['traffic:*'].secondCall.args[0]).to.equal('received');
      expect(config.listeners['traffic:*'].secondCall.args[1]).to.containSubset(response);
    });
  });
});