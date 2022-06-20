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

export interface QueryFilters {
  yearStart?: string;
  yearEnd?: string;
  authorIds?: string;
  venueIds?: string;
  openAccess?: string;
  typesOfPaper?: string;
  fieldsOfStudy?: string;
  publishers?: string;
}

export interface Pattern {
  column?: string;
  pattern?: string;
}

export interface FilterMongo {
  yearPublished?: {
    $gte?: number;
    $lte?: number;
  };
  authorIds?: { $in: mongoose.Types.ObjectId[] };
  venueId?: { $in: mongoose.Types.ObjectId[] };
  openAccess?: boolean;
  typeOfPaper?: { $in: string[] };
  fieldsOfStudy?: { $in: string[] };
  publisher?: { $in: string[] };
}
