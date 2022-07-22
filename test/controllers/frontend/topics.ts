import { beforeEach, describe } from 'mocha';
import 'mocha';
import sinon, { SinonSandbox } from 'sinon';
import chai, { expect, should } from 'chai';
import chaiHttp from 'chai-http';
import { APIServer } from '../../../src/app/apiserver';
import { APIOptions } from '../../../src/config/interfaces';
import * as Setup from '../../setup';
import { createTestdata, createUser, getAdmin } from './testdata';

process.env.NODE_ENV = 'test';

chai.use(chaiHttp);

let apiServer: APIServer;
let apiOptions: APIOptions;
let userToken: string;

describe('/fe/topics', () => {
  const route = '/fe/topics';
  const host = '123.4.5.678';
  const port = '1234';
  process.env.PREDICTIONS_ENDPOINT_HOST = host;
  process.env.PREDICTIONS_ENDPOINT_PORT = port;
  process.env.LDA_PAPER_LIMIT = '3';

  before(async () => {
    await Setup.initDb();
    ({ apiServer, apiOptions } = await Setup.initApi());

    const adminUser = await getAdmin(apiServer, apiOptions);
    await createTestdata(apiServer, adminUser);
    userToken = await createUser(apiServer, apiOptions);
  });

  after(async () => {
    await Setup.clearDatabase(['papers', 'venues', 'authors']);
  });

  describe('No access', () => {
    describe('Unauthorized access', () => {
      specify('Unauthorized GET/models', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/models`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });

      specify('Unauthorized GET/lda', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/lda`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });
    });

    describe('Missing Parameters', () => {
      specify('Missing parameters GET/lda: modelId', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/lda`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(422);
            done();
          });
      });
    });
  });

  describe('Successful access', () => {
    var sandbox: SinonSandbox;
    beforeEach(function () {
      sandbox = sinon.createSandbox();
    });
    afterEach(() => {
      sandbox.restore();
    });
    describe('GET/models', () => {
      specify('Successful GET/models', (done) => {
        const body = { models: ['123', '456'] };
        const stubbedFetch = sandbox
          .stub(global, 'fetch')
          .returns(Promise.resolve(new Response(JSON.stringify(body), { status: 200 })));
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/models`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body).deep.equal(body);
            sinon.assert.calledWith(stubbedFetch, `http://${host}:${port}/api/v0/models`);
            done();
          });
      });
    });

    describe('GET/lda', () => {
      specify('Successful GET/lda', (done) => {
        const body = { outputData: { test: 'test' } };
        const stubbedFetch = sandbox
          .stub(global, 'fetch')
          .returns(Promise.resolve(new Response(JSON.stringify(body), { status: 200 })));
        const init = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            functionCall: 'getLDAvis',
            inputData: {
              data: [
                {
                  title: 'Some Paper Title',
                  abstractText: 'This paper is about a really interesting topic',
                },
                {
                  title: null,
                  abstractText: null,
                },
              ],
            },
          }),
        };
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/lda?modelId=LDA54321&yearStart=2021`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body).deep.equal(body);
            sinon.assert.calledWith(
              stubbedFetch,
              `http://${host}:${port}/api/v0/models/LDA54321`,
              init
            );
            done();
          });
      });

      specify('Successful GET/lda: too many papers', (done) => {
        const stubbedFetch = sandbox.stub(global, 'fetch');
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/lda?modelId=LDA54321`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(413);
            sinon.assert.notCalled(stubbedFetch);
            done();
          });
      });
    });
  });
});
