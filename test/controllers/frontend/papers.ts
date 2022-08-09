import { describe } from 'mocha';
import 'mocha';
import chai, { expect, should } from 'chai';
import chaiHttp from 'chai-http';
import { APIServer } from '../../../src/app/apiserver';
import { APIOptions } from '../../../src/config/interfaces';
import * as Setup from '../../setup';
import { createTestdata, createUser, dummyAuthors, dummyVenues, getAdmin } from './testdata';

process.env.NODE_ENV = 'test';

chai.use(chaiHttp);

let apiServer: APIServer;
let apiOptions: APIOptions;
let userToken: string;

describe('/fe/papers', () => {
  const route = '/fe/papers';

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

      specify('Unauthorized GET/list', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/list`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });
    });

    describe('Missing Parameters', () => {
      specify('Missing parameters GET/info: page', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/info?pageSize=100`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(422);
            done();
          });
      });

      specify('Missing parameters GET/info: pageSize', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/info?page=0`)
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

      specify('Missing Parameters GET/list: pattern ', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/list`)
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
            expect(res.body.counts[84]).to.equal(1);
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
          .get(
            `${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&sortField=inCitationsCount&sortDirection=desc`
          )
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(3);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(2);
            expect(res.body.rows[0].yearPublished).to.exist;
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
            expect(res.body.rows[0].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(0);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });
    });

    describe('GET/quartiles', () => {
      specify('Successful GET/quartiles', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/quartiles`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(5);
            expect(res.body).to.be.an('array');
            expect(res.body[0]).to.equal(0);
            expect(res.body[4]).to.equal(2);
            done();
          });
      });

      specify('Successful GET/quartiles: no data', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/quartiles?yearStart=2020&yearEnd=2010`)
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
      specify('Successful GET/topk', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/topk?k=10`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(3);
            expect(res.body).to.be.an('array');
            expect(res.body[0]._id).to.not.exist;
            expect(res.body[0].x).to.exist;
            expect(res.body[0].y).to.equal(2);
            expect(res.body[2].y).to.equal(0);
            done();
          });
      });
    });

    describe('GET/list', () => {
      specify('Successful GET/list', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/list?column=publisher&pattern=ABC`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(1);
            expect(res.body[0]._id).to.not.exist;
            expect(res.body[0].title).to.not.exist;
            expect(res.body[0].authors).to.not.exist;
            expect(res.body[0].venue).to.not.exist;
            expect(res.body[0].inCitationsCount).to.not.exist;
            expect(res.body[0].yearPublished).to.not.exist;
            done();
          });
      });
    });

    describe('Filters GET/info', () => {
      specify('Filter yearStart GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${
              apiOptions.server.baseRoute
            }${route}/info?page=0&pageSize=50&yearStart=${2021}&sortField=inCitationsCount&sortDirection=desc`
          )
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(2);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(2);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });

      specify('Filter yearEnd GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&yearEnd=${2021}`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(1);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(0);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });

      specify('Filter authors GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&authorIds=["${dummyAuthors[0]._id}"]&sortField=inCitationsCount&sortDirection=desc`
          )
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(2);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(2);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });

      specify('Filter authors multiple GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&authorIds=["${dummyAuthors[0]._id}", "${dummyAuthors[1]._id}"]&sortField=inCitationsCount&sortDirection=desc`
          )
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(2);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(2);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });

      specify('Filter venue GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&venueIds=["${dummyVenues[0]._id}"]`
          )
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(1);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(2);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });

      specify('Filter typeOfPaper GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&typesOfPaper=["inproceedings"]`
          )
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(1);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(1);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });

      specify('Filter fieldsOfStudy GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&fieldsOfStudy=["Computer Science"]`
          )
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(2);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.be.oneOf([2, 1]);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });

      specify('Filter publisher GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&publishers=["CBA"]`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(1);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(1);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });

      specify('Filter openAccess GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&openAccess=true`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(1);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(2);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });

      specify('Filter citationsMin GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&citationsMin=1`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(2);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[1].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(1);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });

      specify('Filter citationsMax GET/info', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/info?page=0&pageSize=50&citationsMax=1`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.rowCount).to.equal(2);
            expect(res.body.rows).to.be.an('array');
            expect(res.body.rows[0]._id).to.exist;
            expect(res.body.rows[0].title).to.exist;
            expect(res.body.rows[0].authors).to.exist;
            expect(res.body.rows[0].venue).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.exist;
            expect(res.body.rows[0].inCitationsCount).to.equal(0);
            expect(res.body.rows[0].yearPublished).to.exist;
            done();
          });
      });
    });
  });
});
