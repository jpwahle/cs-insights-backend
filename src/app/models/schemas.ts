import mongoose from 'mongoose';

export const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    abstractText: { type: String, required: true },
    abstractExtractor: {
      type: String,
      enum: ['grobid', 'anthology', 'rulebased'],
      required: true,
    },
    typeOfPaper: {
      type: String,
      enum: [
        'journal',
        'conference',
        'demo',
        'workshop',
        'poster',
        'tutorial',
        'doctoralconsortium',
        'masterthesis',
        'phdthesis',
        'other',
      ],
      required: true,
    },
    shortOrLong: {
      type: String,
      enum: ['short', 'long', 'unknown'],
      required: true,
    },

    atMainConference: {
      type: Boolean,
      required: true,
    },
    isSharedTask: {
      type: Boolean,
      required: true,
    },
    isStudentPaper: {
      type: Boolean,
      required: true,
    },

    doi: { type: String, required: true },
    preProcessingGitHash: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    absUrl: { type: String, required: true },

    datePublished: { type: Date, required: true },
    citationInfoTimestamp: { type: Date, required: true },
    cites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper',
      },
    ],

    authors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author',
      },
    ],
    firstAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
    },
    venues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true },
    dblpId: { type: String, required: true },
  },
  { collection: 'papers' }
);

export const venueSchema = new mongoose.Schema(
  {
    names: [{ type: String, required: true }],
    acronyms: [{ type: String, required: true }],
    venueCodes: [{ type: String, required: true }],
    venueDetails: [
      {
        callForPapersText: String,
        timePublished: Date,
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true },
    dblpId: { type: String, required: true },
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
    email: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true },
    dblpId: { type: String, required: true },
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
