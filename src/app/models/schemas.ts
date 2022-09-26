import mongoose from 'mongoose';

export const paperSchema = new mongoose.Schema(
  {
    corpusid: { type: String, required: true, index: true },
    abstract: {
      type: String,
    },
    updated: { type: Date, required: false },
    externalids: {
      type: {
        DBLP: { type: String, index: true },
        DOI: { type: String, index: true },
        ACL: { type: String, index: true },
        ArXiv: { type: String, index: true },
        PubMed: { type: String, index: true },
        PubMedCentral: { type: String, index: true },
        MAG: { type: String, index: true },
        CorpusId: { type: String, index: true },
      },
    },
    url: { type: String },
    title: { type: String, required: true, index: true },
    authors: {
      type: [
        {
          name: { type: String, required: true, index: true },
          authorId: { type: String, required: true, index: true },
        },
      ],
      default: [],
    },
    venue: {
      type: String,
      index: true,
    },
    year: { type: Number, index: true },
    referencecount: { type: Number, index: true, default: 0 },
    citationcount: { type: Number, index: true, default: 0 },
    influentialcitationcount: { type: Number, default: 0 },
    isopenaccess: { type: Boolean, default: false },
    s2fieldsofstudy: {
      type: [
        {
          category: { type: String },
          source: { type: String },
        },
      ],
      default: [],
    },
    publicationtypes: {
      type: [String],
    },
    publicationdate: { type: Date },
    journal: {
      type: {
        name: { type: String },
        volume: { type: String },
        pages: { type: String },
      },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: 'papers' }
);

export const authorSchema = new mongoose.Schema(
  {
    authorid: { type: String, required: true, index: true },
    externalids: {
      type: {
        DBLP: { type: String, index: true },
        DOI: { type: String, index: true },
        ACL: { type: String, index: true },
        arXiv: { type: String, index: true },
        PubMed: { type: String, index: true },
        PubMedCentral: { type: String, index: true },
        MAG: { type: String, index: true },
        CorpusId: { type: String, index: true },
      },
    },
    name: { type: String, required: true, index: true },
    aliases: { type: [String] },
    affiliations: { type: [String], index: true, default: [] },
    homepage: { type: String },
    papercount: { type: Number, index: true, default: 0 },
    citationcount: { type: Number, index: true, default: 0 },
    hindex: { type: Number, index: true, default: 0 },
    updated: { type: Date, required: false },
    s2url: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: 'authors' }
);

export const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    fullname: { type: String, required: true },
    isAdmin: { type: Boolean, required: false, select: false },
    isActive: { type: Boolean, required: false, select: false },
    refreshToken: [{ type: String, required: false, select: false }],
  },
  { collection: 'users' }
);
