import { describe } from 'mocha';
import 'mocha';
import chai, { expect, should } from 'chai';
import chaiHttp from 'chai-http';
import { APIServer } from '../../../src/app/apiserver';
import { APIOptions } from '../../../src/config/interfaces';
import * as Setup from '../../setup';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';

const lodash = require('lodash');

chai.use(chaiHttp);

let apiServer: APIServer;
let apiOptions: APIOptions;
let userToken: string;

describe('/fe/papers', () => {
  const route = '/fe/papers';

  const dummyVenue = {
    _id: new mongoose.Types.ObjectId(),
    dblpId: 'some-id-123',
  };

  const dummyVenue2 = {
    _id: new mongoose.Types.ObjectId(),
    dblpId: 'some-id-124',
  };

  const dummyAuthor = {
    _id: new mongoose.Types.ObjectId(),
    fullname: 'test',
  };

  const dummyAuthor2 = {
    _id: new mongoose.Types.ObjectId(),
    fullname: 'test',
  };

  const dummyPaper = {
    title: 'Some Paper Title',
    abstractText: 'This paper is about a really interesting topic',
    typeOfPaper: 'article',
    doi: 'doi/1.23.123',
    pdfUrls: ['https://dummy-url.de/pdf.pdf'],
    absUrl: 'https://dummy-url.de/',
    yearPublished: 2022,
    inCitationsCount: 2,
    outCitationsCount: 0,
    authors: [dummyAuthor._id, dummyAuthor2._id],
    venue: dummyVenue._id,
    dblpId: 'some-id-127',
    csvId: '1',
  };

  const dummyPaper2 = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Some Paper Title',
    abstractText: 'This paper is about a really interesting topic',
    typeOfPaper: 'article',
    doi: 'doi/1.23.123',
    pdfUrls: ['https://dummy-url.de/pdf.pdf'],
    absUrl: 'https://dummy-url.de/',
    yearPublished: 2020,
    inCitationsCount: 0,
    outCitationsCount: 0,
    authors: null,
    venue: null,
    dblpId: 'some-id-12',
    csvId: '2',
  };

  const dummyPaper3 = {
    title: 'Some Paper Title',
    abstractText: 'This paper is about a really interesting topic',
    typeOfPaper: 'article',
    doi: 'doi/1.23.123',
    pdfUrls: ['https://dummy-url.de/pdf.pdf'],
    absUrl: 'https://dummy-url.de/',
    yearPublished: 2022,
    inCitationsCount: 1,
    outCitationsCount: 0,
    authors: [dummyAuthor._id],
    venue: new mongoose.Types.ObjectId(),
    dblpId: 'some-id-129',
    csvId: '3',
  };

  before(async () => {
    await Setup.initDb();
    const { app, options } = await Setup.initApi();
    apiServer = app;
    apiOptions = options;
    const adminToken = (
      await chai
        .request(app.app)
        .post(`${options.server.baseRoute}/login`)
        .send(options.user.default)
    ).body.token;
    const adminUser = (
      await chai
        .request(app.app)
        .get(`${options.server.baseRoute}/users?query={"email":"${options.user.default.email}"}`)
        .set('Authorization', `Bearer ${adminToken}`)
    ).body[0];

    const dummyCreated = {
      createdAt: new Date(),
      createdBy: adminUser._id,
    };
    await apiServer.models.Venue.create(
      lodash.merge(dummyVenue, dummyCreated),
      lodash.merge(dummyVenue2, dummyCreated)
    );
    await apiServer.models.Author.create(
      lodash.merge(dummyAuthor, dummyCreated),
      lodash.merge(dummyAuthor2, dummyCreated)
    );
    await apiServer.models.Paper.create(
      lodash.merge(dummyPaper, dummyCreated),
      lodash.merge(dummyPaper2, dummyCreated),
      lodash.merge(dummyPaper3, dummyCreated)
    );

    await chai.request(apiServer.app).post(`${apiOptions.server.baseRoute}/register`).send({
      email: 'dummy@user.de',
      password: 'insecure',
      fullname: 'Your Name',
    });
    userToken = (
      await chai.request(apiServer.app).post(`${apiOptions.server.baseRoute}/login`).send({
        email: 'dummy@user.de',
        password: 'insecure',
      })
    ).body.token;
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

      specify('Unauthorized GET/paged', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/paged`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
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

      specify('GET/years filter yearStart', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/years?yearStart=2021`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.years).to.be.an('array');
            expect(res.body.years[1]).to.equal(2022);
            expect(res.body.counts).to.be.an('array');
            expect(res.body.counts[1]).to.equal(3);
            done();
          });
      });

      specify('GET/years filter yearEnd', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/years?yearEnd=2021`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.years).to.be.an('array');
            expect(res.body.years[84]).to.equal(2020);
            expect(res.body.counts).to.be.an('array');
            expect(res.body.counts[0]).to.equal(0);
            done();
          });
      });

      specify('GET/years filter author', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/years?authors=["${dummyAuthor._id}"]`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.years).to.be.an('array');
            expect(res.body.years[84]).to.equal(2020);
            expect(res.body.counts).to.be.an('array');
            expect(res.body.counts[0]).to.equal(0);
            done();
          });
      });

      specify('GET/years filter venue', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/years?venues=["${dummyVenue._id}"]`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body.years).to.be.an('array');
            expect(res.body.years[86]).to.equal(2022);
            expect(res.body.counts).to.be.an('array');
            expect(res.body.counts[86]).to.equal(2);
            done();
          });
      });

      specify('GET/years filter no results', (done) => {
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

    describe('GET/paged', () => {
      specify('Successful GET/paged', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/paged?page=0&pageSize=50`)
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

      specify('Successful GET/paged: sorted', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/paged?page=0&pageSize=50&sortField=inCitationsCount&sortDirection=asc`
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

      specify('Unsuccessful GET/paged: missing parameters', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/paged`)
          .set('Authorization', `Bearer ${userToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(422);
            done();
          });
      });

      specify('GET/paged filter yearStart', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/paged?page=0&pageSize=50&yearStart=${2021}`)
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

      specify('GET/paged filter yearEnd', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/paged?page=0&pageSize=50&yearEnd=${2021}`)
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

      specify('GET/paged filter yearEnd', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/paged?page=0&pageSize=50&yearEnd=${2021}`)
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

      specify('GET/paged filter authors', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/paged?page=0&pageSize=50&authors=["${dummyAuthor._id}"]`
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

      specify('GET/paged filter authors multiple', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/paged?page=0&pageSize=50&authors=["${dummyAuthor._id}", "${dummyAuthor2._id}"]`
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

      specify('GET/paged filter venue', (done) => {
        chai
          .request(apiServer.app)
          .get(
            `${apiOptions.server.baseRoute}${route}/paged?page=0&pageSize=50&venues=["${dummyVenue._id}"]`
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
    });
  });
});
