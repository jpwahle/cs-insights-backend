process.env.NODE_ENV = 'test';

import 'mocha';
import chai, { expect, should } from 'chai';
import chaiHttp from 'chai-http';
import { APIServer } from '../../src/app/apiserver';
import { APIOptions } from '../../src/config/interfaces';
import * as Setup from '../setup';
import * as DocumentTypes from '../../src/app/models/interfaces';
import mongoose from 'mongoose';
const lodash = require('lodash');

chai.use(chaiHttp);

let apiServer: APIServer;
let apiOptions: APIOptions;
let adminToken: string;
let adminUser: DocumentTypes.User;

describe('/papers', () => {
  const route = '/papers';

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
    email: 'test@test.com',
    dblpId: 'some-id-125',
  };

  const dummyAuthor2 = {
    _id: new mongoose.Types.ObjectId(),
    fullname: 'test',
    email: 'test@test.com',
    dblpId: 'some-id-126',
  };

  const dummyPaper = {
    title: 'Some Paper Title',
    abstractText: 'This paper is about a really interesting topic',
    abstractExtractor: 'grobid',
    typeOfPaper: 'conference',
    shortOrLong: 'long',
    atMainConference: true,
    isSharedTask: false,
    isStudentPaper: false,
    doi: 'doi/1.23.123',
    preProcessingGitHash: 'f8bdd1bcdcd8480439d28a38f2fb8c25e20d76c6',
    pdfUrl: 'https://dummy-url.de/pdf.pdf',
    absUrl: 'https://dummy-url.de/',
    datePublished: new Date(),
    citationInfoTimestamp: new Date(),
    cites: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
    authors: [dummyAuthor._id, dummyAuthor2._id],
    firstAuthor: new mongoose.Types.ObjectId(),
    venues: [dummyVenue._id, dummyVenue2._id],
    dblpId: 'some-id-127',
  };

  const dummyPaper2 = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Some Paper Title',
    abstractText: 'This paper is about a really interesting topic',
    abstractExtractor: 'grobid',
    typeOfPaper: 'conference',
    shortOrLong: 'long',
    atMainConference: true,
    isSharedTask: false,
    isStudentPaper: false,
    doi: 'doi/1.23.123',
    preProcessingGitHash: 'f8bdd1bcdcd8480439d28a38f2fb8c25e20d76c6',
    pdfUrl: 'https://dummy-url.de/pdf.pdf',
    absUrl: 'https://dummy-url.de/',
    datePublished: new Date(),
    citationInfoTimestamp: new Date(),
    cites: [],
    authors: [],
    venues: [],
    dblpId: 'some-id-12',
  };

  const dummyPaper3 = {
    title: 'Some Paper Title',
    abstractText: 'This paper is about a really interesting topic',
    abstractExtractor: 'grobid',
    typeOfPaper: 'conference',
    shortOrLong: 'long',
    atMainConference: true,
    isSharedTask: false,
    isStudentPaper: false,
    doi: 'doi/1.23.123',
    preProcessingGitHash: 'f8bdd1bcdcd8480439d28a38f2fb8c25e20d76c6',
    pdfUrl: 'https://dummy-url.de/pdf.pdf',
    absUrl: 'https://dummy-url.de/',
    datePublished: new Date(),
    citationInfoTimestamp: new Date(),
    cites: [dummyPaper2._id],
    authors: [dummyAuthor._id],
    firstAuthor: new mongoose.Types.ObjectId(),
    venues: [new mongoose.Types.ObjectId()],
    dblpId: 'some-id-129',
  };

  const dummyUpdate = {
    title: 'A New Title',
  };

  before(async () => {
    await Setup.initDb();
    const { app, options } = await Setup.initApi();
    apiServer = app;
    apiOptions = options;
    adminToken = (
      await chai
        .request(app.app)
        .post(`${options.server.baseRoute}/login`)
        .send(options.user.default)
    ).body.token;
    adminUser = (
      await chai
        .request(app.app)
        .get(`${options.server.baseRoute}/users?query={"email":"${options.user.default.email}"}`)
        .set('Authorization', `Bearer ${adminToken}`)
    ).body[0];
  });

  afterEach(async () => {
    await Setup.clearDatabase(['papers', 'venues', 'authors']);
  });

  describe('No access', () => {
    let someUserToken: string;
    before(async () => {
      await chai.request(apiServer.app).post(`${apiOptions.server.baseRoute}/register`).send({
        email: 'dummy@user.de',
        password: 'insecure',
        fullname: 'Your Name',
      });
      someUserToken = (
        await chai.request(apiServer.app).post(`${apiOptions.server.baseRoute}/login`).send({
          email: 'dummy@user.de',
          password: 'insecure',
        })
      ).body.token;
    });
    describe('Unauthorized access', () => {
      specify('Unauthorized GET', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });

      specify('Unauthorized POST', (done) => {
        chai
          .request(apiServer.app)
          .post(`${apiOptions.server.baseRoute}${route}`)
          .send(dummyPaper)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });

      specify('Unauthorized PATCH', (done) => {
        chai
          .request(apiServer.app)
          .patch(
            `${apiOptions.server.prefix}${
              apiOptions.server.version
            }${route}/${mongoose.Types.ObjectId()}`
          )
          .send(dummyUpdate)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });

      specify('Unauthorized DELETE', (done) => {
        chai
          .request(apiServer.app)
          .delete(`${apiOptions.server.baseRoute}${route}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });
    });

    describe('Forbidden access', () => {
      let paper: DocumentTypes.Paper;

      beforeEach(async () => {
        const dummyPaperDb = lodash.merge(dummyPaper, {
          createdAt: new Date(),
          createdBy: adminUser._id,
        });
        paper = await apiServer.models.Paper.create(dummyPaperDb);
      });

      specify('Forbidden POST', (done) => {
        chai
          .request(apiServer.app)
          .post(`${apiOptions.server.baseRoute}${route}`)
          .set('Authorization', `Bearer ${someUserToken}`)
          .send(dummyPaper)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });
      specify('Forbidden PATCH', (done) => {
        chai
          .request(apiServer.app)
          .patch(`${apiOptions.server.baseRoute}${route}/${paper._id}`)
          .set('Authorization', `Bearer ${someUserToken}`)
          .send(dummyUpdate)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });
      specify('Forbidden DELETE', (done) => {
        chai
          .request(apiServer.app)
          .delete(`${apiOptions.server.baseRoute}${route}/${paper._id}`)
          .set('Authorization', `Bearer ${someUserToken}`)
          .send(dummyPaper)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });
    });
  });

  describe('Successful access', () => {
    let paper: DocumentTypes.Paper;

    beforeEach(async () => {
      const dummyPaperDb = lodash.merge(dummyPaper, {
        createdAt: new Date(),
        createdBy: adminUser._id,
      });
      paper = await apiServer.models.Paper.create(dummyPaperDb);
    });

    specify('Successful GET/:id (with populate)', (done) => {
      chai
        .request(apiServer.app)
        .get(
          `${apiOptions.server.baseRoute}${route}/${paper._id}?populate=createdBy&select=createdBy.fullname,createdBy.email`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body.createdBy).to.exist;
          expect(res.body.createdAt).to.exist;
          expect(res.body.__v).to.exist;
          expect(res.body._id).to.exist;
          expect(res.body.createdBy.fullname).to.eql(adminUser.fullname);
          expect(res.body.createdBy.email).to.eql(adminUser.email);
          done();
        });
    });

    specify('Successful GET/count', (done) => {
      chai
        .request(apiServer.app)
        .get(`${apiOptions.server.baseRoute}${route}/count`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body.count).to.exist;
          expect(res.body.count).to.eql(1);
          done();
        });
    });

    specify('Successful GET', (done) => {
      chai
        .request(apiServer.app)
        .get(`${apiOptions.server.baseRoute}${route}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body[0].createdBy).to.exist;
          expect(res.body[0].createdAt).to.exist;
          expect(res.body[0].__v).to.exist;
          expect(res.body[0]._id).to.exist;
          done();
        });
    });

    specify('Successful POST', (done) => {
      chai
        .request(apiServer.app)
        .post(`${apiOptions.server.baseRoute}${route}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dummyPaper)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(201);
          expect(res.body.createdBy).to.exist;
          expect(res.body.createdAt).to.exist;
          expect(res.body.__v).to.exist;
          expect(res.body._id).to.exist;
          expect(res.body.createdBy.id == adminUser._id);
          done();
        });
    });

    specify('Successful PATCH', (done) => {
      chai
        .request(apiServer.app)
        .patch(`${apiOptions.server.baseRoute}${route}/${paper._id}`)
        .send(dummyUpdate)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body.title).to.exist;
          expect(res.body.title).to.be.eql(dummyUpdate.title);
          done();
        });
    });

    specify('Successful DELETE', async () => {
      const res = await chai
        .request(apiServer.app)
        .delete(`${apiOptions.server.baseRoute}${route}/${paper._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res).to.have.status(204);
      expect((await apiServer.models.Paper.countDocuments()) === 0);
    });
  });

  describe('Successful access (frontend endpoints)', () => {
    beforeEach(async () => {
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
    });

    specify('Successful GET/stats', (done) => {
      chai
        .request(apiServer.app)
        .get(`${apiOptions.server.baseRoute}/fe${route}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body.timeData.years).to.be.an('array');
          expect(res.body.timeData.years[0]).to.equal(new Date().getFullYear());
          expect(res.body.timeData.cites).to.be.an('array');
          expect(res.body.timeData.cites[0]).to.equal(3);
          done();
        });
    });

    specify('Successful GET/paged', (done) => {
      chai
        .request(apiServer.app)
        .get(`${apiOptions.server.baseRoute}/fe${route}/paged?page=0&pageSize=50`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body.rowCount).to.equal(3);
          expect(res.body.rows).to.be.an('array');
          expect(res.body.rows[0]._id).to.exist;
          expect(res.body.rows[0].title).to.exist;
          expect(res.body.rows[0].authors).to.exist;
          expect(res.body.rows[0].venues).to.exist;
          expect(res.body.rows[0].cites).to.exist;
          expect(res.body.rows[0].cites).to.equal(2);
          expect(res.body.rows[0].year).to.exist;
          done();
        });
    });
  });
});
