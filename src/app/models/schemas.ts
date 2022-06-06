import mongoose from 'mongoose';

export const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    abstractText: {
      type: String,
    },
    yearPublished: { type: Number },

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
    publisher: { type: String },

    typeOfPaper: {
      type: String,
      enum: [
        'article',
        'inproceedings',
        'book',
        'incollection',
        'proceedings',
        'phdthesis',
        'mastersthesis',
      ],
      required: true,
    },
    fieldsOfStudy: [
      {
        type: String,
        enum: [
          'Art',
          'Biology',
          'Business',
          'Chemistry',
          'Computer Science',
          'Economics',
          'Engineering',
          'Environmental Science',
          'Geography',
          'Geology',
          'History',
          'Materials Science',
          'Mathematics',
          'Medicine',
          'Philosophy',
          'Physics',
          'Political Science',
          'Psychology',
          'Sociology',
        ],
      },
    ],

    inCitations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper',
      },
    ],
    inCitationsCount: { type: Number, required: true, default: 0 },
    // inCitationsRef: [{ type: String, required: true }], //TODO add
    outCitations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper',
      },
    ],
    outCitationsCount: { type: Number, required: true, default: 0 },
    // outCitationsRef: [{ type: String, required: true }], //TODO add

    openAccess: { type: Boolean, required: true, default: false },

    dblpId: { type: String, unique: true, sparse: true },
    doi: { type: String },
    pdfUrls: [{ type: String }],
    url: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true },

    // datasetId: { type: String, unique: true, required: true }, //TODO add
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
  },
  { collection: 'venues' }
);

export const authorSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    number: { type: String },
    orcid: { type: String, unique: true, sparse: true },
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
