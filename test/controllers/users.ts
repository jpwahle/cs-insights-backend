process.env.NODE_ENV = 'test';

import 'mocha';
import chai, { expect, should } from 'chai';
import chaiHttp from 'chai-http';
import { APIServer } from '../../src/app/apiserver';
import { APIOptions } from '../../src/config/interfaces';
import * as Setup from '../setup';
import * as DocumentTypes from '../../src/app/models/interfaces';
import mongoose from 'mongoose';

chai.use(chaiHttp);

let apiServer: APIServer;
let apiOptions: APIOptions;
let adminToken: string;

describe('/users', () => {
  const route = '/users';

  const dummyUser = {
    email: 'test@test.de',
    fullname: 'Test Name',
    password: 'InsecurePassword',
  };

  const dummyUpdate = {
    email: 'new@email.de',
  };

  const isAdminUpdate = {
    isAdmin: true,
  };

  before(async () => {
    await Setup.initDb();
    ({ apiServer, apiOptions } = await Setup.initApi());

    adminToken = (
      await chai
        .request(apiServer.app)
        .post(`${apiOptions.server.prefix}${apiOptions.server.version}/login`)
        .send(apiOptions.user.default)
    ).body.token;
  });

  describe('No access', () => {
    let someUserToken: string;

    const someUser = {
      email: 'dummy@user.de',
      password: 'insecure',
      fullname: 'Your Name',
    };

    before(async () => {
      await chai
        .request(apiServer.app)
        .post(`${apiOptions.server.prefix}${apiOptions.server.version}/register`)
        .send(someUser);
      someUserToken = (
        await chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}/login`)
          .send({
            email: someUser.email,
            password: someUser.password,
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
          .send(dummyUser)
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
      let user: DocumentTypes.User;

      beforeEach(async () => {
        const u = await apiServer.models.User.findOne({ email: someUser.email });
        if (u) user = u;
      });

      specify('Forbidden POST', (done) => {
        chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}${route}`)
          .set('Authorization', `Bearer ${someUserToken}`)
          .send(dummyUser)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });

      specify('Forbidden POST (also as admin)', (done) => {
        chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}${route}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(dummyUser)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });

      specify('Forbidden PATCH isAdmin flag (as non-admin)', (done) => {
        chai
          .request(apiServer.app)
          .patch(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/${user._id}`)
          .set('Authorization', `Bearer ${someUserToken}`)
          .send(isAdminUpdate)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });

      specify('Forbidden PATCH (as non-admin and not same user)', (done) => {
        chai
          .request(apiServer.app)
          .patch(
            `${apiOptions.server.prefix}${
              apiOptions.server.version
            }${route}/${new mongoose.Types.ObjectId()}`
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
          .delete(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/${user._id}`)
          .set('Authorization', `Bearer ${someUserToken}`)
          .send(dummyUser)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(403);
            done();
          });
      });
    });
    describe('Wrong register/login', () => {
      specify('Wrong register request', (done) => {
        chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}/register`)
          .send({
            email: 'test@test.de',
          })
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(400);
            done();
          });
      });

      specify('Non-existing login credentials', (done) => {
        chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}/login`)
          .send({
            email: 'doesNotExist',
            password: 'doesNotExist',
          })
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(400);
            done();
          });
      });
      specify('Wrong password', (done) => {
        chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}/login`)
          .send({
            email: someUser.email,
            password: 'wrongPassword',
          })
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(400);
            done();
          });
      });
    });
  });

  describe('Successful access', () => {
    let user: DocumentTypes.User;
    let someUserToken: string;

    const someUser = {
      email: 'dummy@user.de',
      password: 'insecure',
      fullname: 'Your Name',
    };

    before(async () => {
      await chai
        .request(apiServer.app)
        .post(`${apiOptions.server.prefix}${apiOptions.server.version}/register`)
        .send(someUser);
      someUserToken = (
        await chai
          .request(apiServer.app)
          .post(`${apiOptions.server.prefix}${apiOptions.server.version}/login`)
          .send({
            email: someUser.email,
            password: someUser.password,
          })
      ).body.token;
    });

    beforeEach(async () => {
      const u = await apiServer.models.User.findOne({ email: someUser.email });
      if (u) user = u;
    });

    specify('Successful GET/:id (with populate)', (done) => {
      chai
        .request(apiServer.app)
        .get(
          `${apiOptions.server.prefix}${apiOptions.server.version}${route}/${user._id}?populate=createdBy&select=createdBy.fullname,createdBy.email`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body.__v).to.exist;
          expect(res.body._id).to.exist;
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
          expect(res.body.count).to.eql(2);
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
          expect(res.body[0].__v).to.exist;
          expect(res.body[0]._id).to.exist;
          done();
        });
    });

    specify('Successful PATCH isAdmin flag (as admin)', (done) => {
      chai
        .request(apiServer.app)
        .patch(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/${user._id}`)
        .send(dummyUpdate)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body.email).to.exist;
          expect(res.body.email).to.be.eql(dummyUpdate.email);
          done();
        });
    });

    specify('Successful PATCH own user (non-admin)', (done) => {
      chai
        .request(apiServer.app)
        .patch(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/${user._id}`)
        .send(dummyUpdate)
        .set('Authorization', `Bearer ${someUserToken}`)
        .end((err, res) => {
          should().not.exist(err);
          expect(res).to.have.status(200);
          expect(res.body.email).to.exist;
          expect(res.body.email).to.be.eql(dummyUpdate.email);
          done();
        });
    });

    specify('Successful DELETE', async () => {
      const res = await chai
        .request(apiServer.app)
        .delete(`${apiOptions.server.prefix}${apiOptions.server.version}${route}/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res).to.have.status(204);
      expect((await apiServer.models.User.countDocuments()) === 0);
    });
  });
});
