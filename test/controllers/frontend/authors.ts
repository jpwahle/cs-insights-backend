import { describe } from 'mocha';
import 'mocha';
import chai, { expect, should } from 'chai';
import chaiHttp from 'chai-http';
import { APIServer } from '../../../src/app/apiserver';
import { APIOptions } from '../../../src/config/interfaces';
import * as Setup from '../../setup';
import * as DocumentTypes from '../../../src/app/models/interfaces';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';

const lodash = require('lodash');

chai.use(chaiHttp);

let apiServer: APIServer;
let apiOptions: APIOptions;
let adminToken: string;
let adminUser: DocumentTypes.User;

describe('/fe/authors', () => {
  const route = '/fe/authors';

  const dummyAuthor = {
    _id: new mongoose.Types.ObjectId(),
    fullname: 'test',
    email: 'test@test.com',
    dblpId: 'some-id-125',
  };

  const dummyAuthor2 = {
    _id: new mongoose.Types.ObjectId(),
    fullname: 'hello',
    email: 'test@test.com',
    dblpId: 'some-id-126',
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

    const dummyCreated = {
      createdAt: new Date(),
      createdBy: adminUser._id,
    };

    await apiServer.models.Author.create(
      lodash.merge(dummyAuthor, dummyCreated),
      lodash.merge(dummyAuthor2, dummyCreated)
    );
  });

  after(async () => {
    await Setup.clearDatabase(['authors']);
  });

  describe('No access', () => {
    describe('Unauthorized access', () => {
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
  });

  // TODO change tests to use someUserToken instead of adminToken
  describe('Successful access', () => {
    describe('GET/list', () => {
      specify('Successful GET/list', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/list?pattern=hell`)
          .set('Authorization', `Bearer ${adminToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body).to.be.length(1);
            expect(res.body[0].fullname).to.equal('hello');
            done();
          });
      });

      specify('Unsuccessful GET/list: missing parameters', (done) => {
        chai
          .request(apiServer.app)
          .get(`${apiOptions.server.baseRoute}${route}/list`)
          .set('Authorization', `Bearer ${adminToken}`)
          .end((err, res) => {
            should().not.exist(err);
            expect(res).to.have.status(422);
            done();
          });
      });
    });
  });
});
