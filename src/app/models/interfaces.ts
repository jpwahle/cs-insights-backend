import mongoose from 'mongoose';

export interface Paper extends mongoose.Document {
  corpusid: string;
  abstract: string;
  updated: Date;
  externalids: {
    DBLP: string;
    DOI: string;
    ACL: string;
    arXiv: string;
    PubMed: string;
    PubMedCentral: string;
    MAG: string;
    CorpusId: string;
  };
  url: string;
  title: string;
  authors: { name: string; authorId: string }[];
  venue: string;
  year: number;
  referencecount: number;
  citationcount: number;
  influentialcitationcount: number;
  isopenaccess: boolean;
  s2fieldsofstudy: string[];
  publicationtypes: string[];
  publicationdate: Date;
  journal: {
    name: string;
    volume: string;
    pages: string;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface Author extends mongoose.Document {
  authorid: string;
  externalids: {
    DBLP: string;
    DOI: string;
    ACL: string;
    arXiv: string;
    PubMed: string;
    PubMedCentral: string;
    MAG: string;
    CorpusId: string;
  };
  name: string;
  aliases: string[];
  affiliations: string[];
  homepage: string;
  papercount: number;
  citationcount: number;
  hindex: number;
  updated: Date;
  s2url: string;
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
  refreshToken?: string[];
}
