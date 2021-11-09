import mongoose from 'mongoose';

export interface Author extends mongoose.Document {
  fullname: string;
  affiliations: mongoose.Types.ObjectId[];
  timestamp: Date;
  email: string;
}

export interface Affiliation extends mongoose.Document {
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
}

export interface Venue extends mongoose.Document {
  names: string[];
  acronyms: string[];
  venueCodes: string[];
  venueDetails: {
    callForPapersText: string;
    timePublished: Date;
  }[];
}

export interface Paper extends mongoose.Document {
  title: string;
  abstractText: string;
  abstractExtractor: 'grobid' | 'anthology' | 'rulebased';
  typeOfPaper:
    | 'journal'
    | 'conference'
    | 'demo'
    | 'workshop'
    | 'poster'
    | 'tutorial'
    | 'doctoralconsortium'
    | 'other';
  shortOrLong: 'short' | 'long' | 'other';

  atMainConference: boolean;
  isSharedTask: boolean;
  isStudentPaper: boolean;

  doi: string;
  preProcessingGitHash: string;
  pdfUrl: string;
  absUrl: string;

  datePublished: Date;
  citationInfoTimestamp: Date;
  citedBy: mongoose.Types.ObjectId[];

  authors: mongoose.Types.ObjectId[];
  firstAuthor: mongoose.Types.ObjectId;
  venues: mongoose.Types.ObjectId[];
}

export interface User extends mongoose.Document {
  email: string;
  password: string;
  fullname: string;
  token?: string;
  isAdmin?: boolean;
  isActive?: boolean;
}
