import mongoose from 'mongoose';

export const paperSchema = new mongoose.Schema(
  {
    corpusid: { type: String, required: true, index: true },
    abstract: {
      type: String,
      index: true,
    },
    updated: { type: Date, required: false, index: true },
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
    url: { type: String, index: true },
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
    influentialcitationcount: { type: Number, index: true, default: 0 },
    isopenaccess: { type: Boolean, index: true, default: false },
    s2fieldsofstudy: {
      type: [
        {
          category: { type: String, index: true },
          source: { type: String, index: true },
        },
      ],
      default: [],
    },
    publicationtypes: {
      type: [String],
      index: true,
    },
    publicationdate: { type: Date, index: true },
    journal: {
      type: {
        name: { type: String, index: true },
        volume: { type: String, index: true },
        pages: { type: String, index: true },
      },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdAt: { type: Date, required: true, index: true },
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
    aliases: { type: [String], index: true },
    affiliations: { type: [String], index: true, default: [] },
    homepage: { type: String, index: true },
    papercount: { type: Number, index: true, default: 0 },
    citationcount: { type: Number, index: true, default: 0 },
    hindex: { type: Number, index: true, default: 0 },
    updated: { type: Date, required: false, index: true },
    s2url: { type: String, index: true },
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
