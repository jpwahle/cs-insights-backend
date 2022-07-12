import { describe } from 'mocha';
import 'mocha';
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

describe('/fe/fields', () => {
  const route = '/fe/fields';

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
      specify('Unauthorized GET/years', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/years`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });

      specify('Unauthorized GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/info`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });

      specify('Unauthorized GET/quartiles', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/quartiles`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });

      specify('Unauthorized GET/topk', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/topk`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });
    });

    describe('Missing Parameters', () => {
      specify('Missing parameters GET/quartiles: metric', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/quartiles`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(422);
            done();
          });
      });

      specify('Missing parameters GET/topk: metric', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/topk?k=10`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(422);
            done();
          });
      });

      specify('Missing parameters GET/topk: k', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/topk?metric=papersCount`)
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
    describe('GET/years', () => {
      specify('Successful GET/years', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/years`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.years).to.be.an('array');
            expect(res.body.years[0]).to.equal(1936);
            expect(res.body.years[84]).to.equal(2020);
            expect(res.body.counts).to.be.an('array');
            expect(res.body.counts[0]).to.equal(0);
            expect(res.body.counts[84]).to.equal(0);
            done();
          });
      });

      specify('Successful GET/years: no results', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/years?yearStart=2022&yearEnd=2020`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.years).to.be.an('array');
            expect(res.body.counts).to.be.an('array');
            expect(res.body.counts.every((count: number) => count === 0));
            done();
          });
      });
    });

    describe('GET/info', () => {
      specify('Successful GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(3);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].fieldsOfStudy).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].yearPublishedFirst).to.exist;
            expect(res.body.rows[0].yearPublishedLast).to.exist;
            expect(res.body.rows[0].papersCount).to.exist;
            expect(res.body.rows[0].inCitationsPerPaper).to.exist;
            done();
          });
      });

      specify('Successful GET/info: sorted', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&sortField=inCitationsCount&sortDirection=asc`
          )
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(3);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].fieldsOfStudy).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[2].inCitationsCount).to.equal(3);
            expect(res.body.rows[0].yearPublishedFirst).to.exist;
            expect(res.body.rows[0].yearPublishedLast).to.exist;
            expect(res.body.rows[0].papersCount).to.exist;
            expect(res.body.rows[0].inCitationsPerPaper).to.exist;
            done();
          });
      });

      specify('Successful GET/info: no data', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&yearStart=2020&yearEnd=2010`
          )
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(0);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]).to.not.exist;
            done();
          });
      });
    });

    describe('GET/quartiles', () => {
      specify('Successful GET/quartiles: papersCount', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/quartiles?metric=papersCount`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(5);
            expect(res.body).to.be.an('array');
            expect(res.body[0]).to.equal(1);
            expect(res.body[4]).to.equal(2);
            done();
          });
      });

      specify('Successful GET/quartiles: inCitationsCount', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/quartiles?metric=inCitationsCount`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(5);
            expect(res.body).to.be.an('array');
            expect(res.body[0]).to.equal(2);
            expect(res.body[4]).to.equal(3);
            done();
          });
      });

      specify('Successful GET/quartiles: no data', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/quartiles?metric=inCitationsCount&yearStart=2020&yearEnd=2010`
          )
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(5);
            expect(res.body).to.be.an('array');
            expect(res.body).to.deep.equal([0, 0, 0, 0, 0]);
            done();
          });
      });
    });

    describe('GET/topk', () => {
      specify('Successful GET/topk: papersCount', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/topk?k=10&metric=papersCount`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(2);
            expect(res.body).to.be.an('array');
            expect(res.body[0]._id).to.not.exist;
            expect(res.body[0].x).to.exist;
            expect(res.body[0].y).to.equal(2);
            expect(res.body[1].y).to.equal(1);
            done();
          });
      });

      specify('Successful GET/topk: inCitationsCount', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/topk?k=10&metric=inCitationsCount`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(2);
            expect(res.body).to.be.an('array');
            expect(res.body[0]._id).to.not.exist;
            expect(res.body[0].x).to.exist;
            expect(res.body[0].y).to.equal(3);
            expect(res.body[1].y).to.equal(2);
            done();
          });
      });
    });
  });
});
