import mongoose from 'mongoose';
import lodash from 'lodash';
import { User } from '../../../src/app/models/interfaces';
import { APIServer } from '../../../src/app/apiserver';
import chai from 'chai';
import { APIOptions } from '../../../src/config/interfaces';

export const dummyVenues = [
  {
    _id: new mongoose.Types.ObjectId(),
    names: ['venue1', 'helloworld'],
    dblpId: 'dblp-v-1',
  },
  {
    _id: new mongoose.Types.ObjectId(),
    names: ['venue2'],
    dblpId: 'dblp-v-2',
  },
];

export const dummyAuthors = [
  {
    _id: new mongoose.Types.ObjectId(),
    fullname: 'author1',
    email: 'test@test.com',
    dblpId: 'dblp-a-1',
  },
  {
    _id: new mongoose.Types.ObjectId(),
    fullname: 'author2',
    email: 'test@test.com',
    dblpId: 'dblp-a-2',
  },
];

export const dummyPapers = [
  {
    title: 'Some Paper Title',
    abstractText: 'This paper is about a really interesting topic',
    doi: 'doi/1.11.111',
    pdfUrls: ['https://dummy-url.de/pdf.pdf'],
    absUrl: 'https://dummy-url.de/',
    yearPublished: 2022,
    inCitationsCount: 2,
    outCitationsCount: 0,
    authors: ['author1', 'author2'],
    authorIds: [dummyAuthors[0]._id, dummyAuthors[1]._id],
    venue: 'venue1',
    venueId: dummyVenues[0]._id,
    typeOfPaper: 'article',
    fieldsOfStudy: ['Computer Science', 'Art'],
    publisher: 'ABC',
    openAccess: true,
    dblpId: 'dblp-p-1',
    csvId: '1',
  },
  {
    _id: new mongoose.Types.ObjectId(),
    title: 'Some Paper Title',
    abstractText: 'This paper is about a really interesting topic',
    doi: 'doi/2.22.222',
    pdfUrls: ['https://dummy-url.de/pdf.pdf'],
    absUrl: 'https://dummy-url.de/',
    yearPublished: 2020,
    inCitationsCount: 0,
    outCitationsCount: 1,
    authorIds: null,
    authors: null,
    venueId: null,
    venue: null,
    typeOfPaper: 'article',
    dblpId: 'dblp-p-2',
    csvId: '2',
  },
  {
    title: null,
    abstractText: null,
    doi: 'doi/3.33.333',
    pdfUrls: ['https://dummy-url.de/pdf.pdf'],
    absUrl: 'https://dummy-url.de/',
    yearPublished: 2022,
    inCitationsCount: 1,
    outCitationsCount: 0,
    authors: ['author1'],
    authorIds: [dummyAuthors[0]._id],
    venue: 'venue2',
    venueId: dummyVenues[1]._id,
    typeOfPaper: 'inproceedings',
    fieldsOfStudy: ['Computer Science'],
    publisher: 'CBA',
    openAccess: false,
    dblpId: 'dblp-p-3',
    csvId: '3',
  },
];

// create papers, venues, authors
export async function createTestdata(apiServer: APIServer, adminUser: User) {
  const dummyCreated = {
    createdAt: new Date(),
    createdBy: adminUser._id,
  };

  await apiServer.models.Venue.create(
    dummyVenues.map((venue) => lodash.merge(venue, dummyCreated))
  );

  await apiServer.models.Author.create(
    dummyAuthors.map((author) => lodash.merge(author, dummyCreated))
  );

  await apiServer.models.Paper.create(
    dummyPapers.map((paper) => lodash.merge(paper, dummyCreated))
  );
}

//return adminUser
export async function getAdmin(apiServer: APIServer, apiOptions: APIOptions): Promise<User> {
  const adminToken = (
    await chai
      .request(apiServer.app)
      .post(`${apiOptions.server.baseRoute}/login`)
      .send(apiOptions.user.default)
  ).body.token;
  return (
    await chai
      .request(apiServer.app)
      .get(
        `${apiOptions.server.baseRoute}/users?query={"email":"${apiOptions.user.default.email}"}`
      )
      .set('Authorization', `Bearer ${adminToken}`)
  ).body[0];
}

// return userToken
export async function createUser(apiServer: APIServer, apiOptions: APIOptions): Promise<string> {
  await chai.request(apiServer.app).post(`${apiOptions.server.baseRoute}/register`).send({
    email: 'dummy@user.de',
    password: 'insecure',
    fullname: 'Your Name',
  });
  return (
    await chai.request(apiServer.app).post(`${apiOptions.server.baseRoute}/login`).send({
      email: 'dummy@user.de',
      password: 'insecure',
    })
  ).body.token;
}
