import mongoose from 'mongoose';

interface PaperOverTime {
  year: string;
  papers: number;
}

interface CiteOverTime {
  year: string;
  cites: number;
}

export type DatapointOverTime = PaperOverTime | CiteOverTime;

export interface PaperJson {
  year: number;
  cites: number;
  title: string;
  venues: string;
  authors: string[];
}

export interface FilterQuery {
  yearStart: string;
  yearEnd: string;
  author?: string;
  venue?: string;
}

export interface FilterMongo {
  datePublished?: {
    $gt?: Date;
    $lt?: Date;
  };
  authors?: mongoose.Types.ObjectId;
  venues?: mongoose.Types.ObjectId;
}
