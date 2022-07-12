import mongoose from 'mongoose';

export interface Affiliation extends mongoose.Document {
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface Author extends mongoose.Document {
  fullname: string;
  affiliations: mongoose.Types.ObjectId[];
  timestamp: Date;
  email: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  dblpId: string;
}

export interface Venue extends mongoose.Document {
  names: string[];
  acronyms: string[];
  venueCodes: string[];
  venueDetails: {
    callForPapersText: string;
    timePublished: Date;
  }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  dblpId: string;
}

export interface Paper extends mongoose.Document {
  title: string;
  abstractText: string;
  yearPublished: number;

  authorIds: mongoose.Types.ObjectId[];
  authors: string[];
  venueId: mongoose.Types.ObjectId;
  venue: string;
  publisher: string;
  typeOfPaper:
    | 'article'
    | 'inproceedings'
    | 'book'
    | 'incollection'
    | 'proceedings'
    | 'phdthesis'
    | 'mastersthesis';
  fieldsOfStudy:
    | 'Art'
    | 'Biology'
    | 'Business'
    | 'Chemistry'
    | 'Computer Science'
    | 'Economics'
    | 'Engineering'
    | 'Environmental Science'
    | 'Geography'
    | 'Geology'
    | 'History'
    | 'Materials Science'
    | 'Mathematics'
    | 'Medicine'
    | 'Philosophy'
    | 'Physics'
    | 'Political Science'
    | 'Psychology'
    | 'Sociology';

  inCitations: mongoose.Types.ObjectId[];
  inCitationsCount: number;
  // inCitationsRef: string[]; //TODO add
  outCitations: mongoose.Types.ObjectId[];
  outCitationsCount: number;
  // outCitationsRef: string[]; //TODO add

  openAccess: boolean;

  // datasetId: string //TODO add
  dblpId: string;
  doi: string;
  pdfUrls: string[];
  url: string;

  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface User extends mongoose.Document {
  email: string;
  fullname: string;
  password?: string;
  token?: string;
  isAdmin?: boolean;
  isActive?: boolean;
}
