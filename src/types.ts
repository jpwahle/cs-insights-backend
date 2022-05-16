import mongoose from 'mongoose';

export type DatapointsOverTime = {
  years: number[];
  counts: number[];
};

export type PagedParameters = {
  page: string;
  pageSize: string;
  sortField: string;
  sortDirection: string;
};

export interface FilterQuery {
  yearStart?: string;
  yearEnd?: string;
  author?: string;
  venue?: string;
}

export interface FilterMongo {
  datePublished?: {
    $gte?: Date;
    $lt?: Date;
  };
  authors?: mongoose.Types.ObjectId;
  venues?: mongoose.Types.ObjectId;
}
