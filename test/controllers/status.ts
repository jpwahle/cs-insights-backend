process.env.NODE_ENV = 'test';

import 'mocha';
import chai, { expect, should } from 'chai';
import chaiHttp from 'chai-http';
import { APIServer } from '../../src/app/apiserver';
import { APIOptions } from '../../src/config/interfaces';
import * as Setup from '../setup';

chai.use(chaiHttp);

let apiServer: APIServer;
let apiOptions: APIOptions;
describe('/status', () => {
  before(async () => {
    await Setup.initDb();
    ({ apiServer, apiOptions } = await Setup.initApi());
  });

  const route = '/status';
  specify('Successful GET/status', (done) => {
    chai
      .request(apiServer.app)
      .get(`${apiOptions.server.prefix}${apiOptions.server.version}${route}`)
      .end((err, res) => {
        should().not.exist(err);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('status');
        expect(res.body).to.have.property('version');
        done();
      });
  });
});
