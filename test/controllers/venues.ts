process.env.NODE_ENV = 'test';

import 'mocha';
import chai, { expect, should } from 'chai';
import chaiHttp from 'chai-http';
import { APIServer } from '../../src/app/apiserver';
import { APIOptions } from '../../src/config/interfaces';
import * as Setup from '../setup';
import * as DocumentTypes from '../../src/app/models/interfaces';
import mongoose from 'mongoose';
import lodash from 'lodash';

chai.use(chaiHttp);

let apiServer: APIServer;
let apiOptions: APIOptions;
let adminToken: string;
let adminUser: DocumentTypes.User;

describe('/venues', () => {
  const route = '/venues';

  const dummyVenue = {
    names: ['Empirical Methods in Natural Language Processing'],
    acronyms: ['EMNLP'],
    venueCodes: ['A_N_Y_C_O_D_E'],
    venueDetails: [
      {
        callForPapersText: 'Test',
        timePublished: new Date(),
      },
    ],
    dblpId: 'something',
  };

  const dummyUpdate = {
    acronyms: ['NEWACRO'],
  };

  before(async () => {
    await Setup.initDb();
    const { app, options } = await Setup.initApi();
    apiServer = app;
    apiOptions = options;
    adminToken = (
      await chai
        .request(app.app)
        .post(`${options.server.prefix}${options.server.version}/login`)
        .send(options.user.default)
    ).body.token;
    adminUser = (
      await chai
        .request(app.app)
        .get(
          `${options.server.prefix}${options.server.version}/users?query={"email":"${options.user.default.email}"}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
    ).body[0];
  });

  afterEach(async () => {
    await Setup.clearDatabase(['venues']);
  });

  describe('No access', () => {
    let someUserToken: string;
    before(async () => {
      await chai
        .request(apiServer.app)
        .post(`${apiOptions.server.prefix}${apiOptions.server.version}/register`)
        .send({
          email: 'dummy@user.de',
          password: 'insecure',
          fullname: 'Your Name',
        });
      someUserToken = (
        await chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}/login`)
          .send({
            email: 'dummy@user.de',
            password: 'insecure',
          })
      ).body.token;
    });
    describe('Unauthorized access', () => {
      specify('Unauthorized GET', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.prefix}${apiOptions.server.version}${route}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });

      specify('Unauthorized POST', (done) => {
        chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}${route}`)
          .send(dummyVenue)
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
          .delete(`${apiOptions.server.prefix}${apiOptions.server.version}${route}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(401);
            done();
          });
      });
    });

    describe('Forbidden access', () => {
      let venue: DocumentTypes.Venue;

      beforeEach(async () => {
        const dummyVenueDb = lodash.merge({}, dummyVenue, {
          createdAt: new Date(),
          createdBy: adminUser._id,
        });
        venue = await apiServer.models.Venue.create(dummyVenueDb);
      });

      specify('Forbidden POST', (done) => {
        chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}${route}`)
          .set('Authorization', `Bearer ${someUserToken}`)
          .send(dummyVenue)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });
      specify('Forbidden PATCH', (done) => {
        chai
          .request(apiServer.app)
          .patch(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/${venue._id}`)
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
          .delete(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/${venue._id}`)
          .set('Authorization', `Bearer ${someUserToken}`)
          .send(dummyVenue)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });
    });
  });

  describe('Successful access', () => {
    let venue: DocumentTypes.Venue;

    beforeEach(async () => {
      const dummyVenueDb = lodash.merge({}, dummyVenue, {
        createdAt: new Date(),
        createdBy: adminUser._id,
      });
      venue = await apiServer.models.Venue.create(dummyVenueDb);
    });

    specify('Successful GET/:id (with populate)', (done) => {
      chai
        .request(apiServer.app)
        .get(
          `${apiOptions.server.prefix}${apiOptions.server.version}${route}/${venue._id}?populate=createdBy&select=createdBy.fullname,createdBy.email`
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
        .get(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/count`)
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
        .get(`${apiOptions.server.prefix}${apiOptions.server.version}${route}`)
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
        .post(`${apiOptions.server.prefix}${apiOptions.server.version}${route}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dummyVenue)
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
        .patch(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/${venue._id}`)
        .send(dummyUpdate)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body.acronyms).to.exist;
          expect(res.body.acronyms).to.be.eql(dummyUpdate.acronyms);
          done();
        });
    });

    specify('Successful DELETE', async () => {
      const res = await chai
        .request(apiServer.app)
        .delete(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/${venue._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res).to.have.status(204);
      expect((await apiServer.models.Venue.countDocuments()) === 0);
    });
  });
});
