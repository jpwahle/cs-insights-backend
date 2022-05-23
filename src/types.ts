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
  authors?: string;
  venues?: string;
}

export interface FilterMongo {
  yearPublished?: {
    $gte?: number;
    $lte?: number;
  };
  authors?: { $in: mongoose.Types.ObjectId[] };
  venue?: { $in: mongoose.Types.ObjectId[] };
}
