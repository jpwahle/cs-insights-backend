import mongoose from 'mongoose';

export type DatapointsOverTime = {
  years: (number | string | null)[];
  counts: number[];
};

export type PagedParameters = {
  page: string;
  pageSize: string;
  sortField: string;
  sortDirection: string;
};

export interface Pattern {
  column?: string;
  pattern?: string;
}

export type Metric = { metric: string };

export type TopKParameters = { k: string } & Metric;

export type ModelId = { modelId: string };

export interface QueryFilters {
  yearStart?: string;
  yearEnd?: string;
  authorIds?: string;
  venueIds?: string;
  openAccess?: string;
  typesOfPaper?: string;
  fieldsOfStudy?: string;
  publishers?: string;
  citationsMin?: string;
  citationsMax?: string;
}

export interface FilterMongo {
  yearPublished?: {
    $gte?: number;
    $lte?: number;
  };
  authorIds?: { $in: mongoose.Types.ObjectId[] };
  venueId?: { $in: mongoose.Types.ObjectId[] } | { $ne: null };
  openAccess?: boolean;
  typeOfPaper?: { $in: string[] } | { $ne: null };
  fieldsOfStudy?: { $in: string[] };
  publisher?: { $in: string[] } | { $ne: null };
  inCitationsCount?: {
    $gte?: number;
    $lte?: number;
  };
}
