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

before(() => {
  return new Promise<void>((resolve) => {
    Setup.initDb().then(() => {
      Setup.initApi().then(() => {
        resolve();
      });
    });
  });
});

after(async () => {
  await Setup.clearDatabase();
  await Setup.closeDatabase();
});

describe('/affiliations', () => {
  const route = '/affiliations';

  const dummyAffiliation = {
    name: 'Google',
    country: 'USA',
    city: 'Mountain View',
    lat: 37.3861,
    lng: 122.0839,
  };

  const dummyUpdate = {
    name: 'New Name',
  };

  before(async () => {
    ({ apiServer, apiOptions } = await Setup.initApi());

    adminToken = (
      await chai
        .request(apiServer.app)
        .post(`${apiOptions.server.prefix}${apiOptions.server.version}/login`)
        .send(apiOptions.user.default)
    ).body.token;
    adminUser = (
      await chai
        .request(apiServer.app)
        .get(
          `${apiOptions.server.prefix}${apiOptions.server.version}/users?query={"email":"${apiOptions.user.default.email}"}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
    ).body[0];
  });

  afterEach(async () => {
    await Setup.clearDatabase(['affiliations']);
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
          .send(dummyAffiliation)
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
      let affiliation: DocumentTypes.Affiliation;

      beforeEach(async () => {
        const dummyAffiliationDb = lodash.merge({}, dummyAffiliation, {
          createdAt: new Date(),
          createdBy: adminUser._id,
        });
        affiliation = await apiServer.models.Affiliation.create(dummyAffiliationDb);
      });

      specify('Forbidden POST', (done) => {
        chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}${route}`)
          .set('Authorization', `Bearer ${someUserToken}`)
          .send(dummyAffiliation)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });
      specify('Forbidden PATCH', (done) => {
        chai
          .request(apiServer.app)
          .patch(
            `${apiOptions.server.prefix}${apiOptions.server.version}${route}/${affiliation._id}`
          )
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
          .delete(
            `${apiOptions.server.prefix}${apiOptions.server.version}${route}/${affiliation._id}`
          )
          .set('Authorization', `Bearer ${someUserToken}`)
          .send(dummyAffiliation)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });
    });
  });

  describe('Successful access', () => {
    let affiliation: DocumentTypes.Affiliation;

    beforeEach(async () => {
      const dummyAffiliationDb = lodash.merge({}, dummyAffiliation, {
        createdAt: new Date(),
        createdBy: adminUser._id,
      });
      affiliation = await apiServer.models.Affiliation.create(dummyAffiliationDb);
    });

    specify('Successful GET/:id (with populate)', (done) => {
      chai
        .request(apiServer.app)
        .get(
          `${apiOptions.server.prefix}${apiOptions.server.version}${route}/${affiliation._id}?populate=createdBy&select=createdBy.fullname,createdBy.email`
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
        .send(dummyAffiliation)
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
        .patch(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/${affiliation._id}`)
        .send(dummyUpdate)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body.name).to.exist;
          expect(res.body.name).to.be.eql(dummyUpdate.name);
          done();
        });
    });

    specify('Successful DELETE', async () => {
      const res = await chai
        .request(apiServer.app)
        .delete(
          `${apiOptions.server.prefix}${apiOptions.server.version}${route}/${affiliation._id}`
        )
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res).to.have.status(204);
      expect((await apiServer.models.Affiliation.countDocuments()) === 0);
    });
  });
});
