import mongoose from 'mongoose';

export const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    abstractText: {
      type: String,
      // required(this: { abstractText: any }): boolean { //TODO
      //   return typeof this.abstractText !== 'string';
      // },
    },
    typeOfPaper: {
      type: String,
      enum: ['article', 'inproceedings', 'book', 'incollection', 'proceedings', 'phdthesis'],
      required: true,
    },
    doi: { type: String, required: true },
    pdfUrls: [{ type: String, required: true }],
    absUrl: { type: String, required: true },

    yearPublished: { type: Number, required: true },
    inCitations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper',
      },
    ],
    inCitationsCount: { type: Number, required: true },
    inCitationsRef: [{ type: String, required: true }], //TODO remove
    outCitations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper',
      },
    ],
    outCitationsCount: { type: Number, required: true },
    outCitationsRef: [{ type: String, required: true }], //TODO remove
    authors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author',
      },
    ],
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
    },
    fieldsOfStudy: [{ type: String, required: true }],
    publisher: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true },
    dblpId: { type: String, unique: true, required: true }, // TODO unique keyword ignored
    csvId: { type: String, unique: true, required: true }, //TODO remove
  },
  { collection: 'papers' }
);

export const venueSchema = new mongoose.Schema(
  {
    names: [{ type: String, required: true }],
    acronyms: [{ type: String, required: true }], // TODO required attributed is ignored in arrays
    venueCodes: [{ type: String, required: true }],
    venueDetails: [
      {
        callForPapersText: String,
        timePublished: Date,
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true },
    // dblpId: { type: String, required: true },
  },
  { collection: 'venues' }
);

export const authorSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    affiliations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Affiliation',
      },
    ],
    timestamp: { type: Date },
    email: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true },
    dblpId: { type: String },
  },
  { collection: 'authors' }
);

export const affiliationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    country: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true },
    city: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  { collection: 'affiliations' }
);

export const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    fullname: { type: String, required: true },
    isAdmin: { type: Boolean, required: false, select: false },
    isActive: { type: Boolean, required: false, select: false },
  },
  { collection: 'users' }
);
