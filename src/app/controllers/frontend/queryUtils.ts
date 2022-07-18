import mongoose, { FilterQuery } from 'mongoose';
import { DatapointsOverTime, FilterMongo, QueryFilters } from '../../../types';
import { NA } from '../../../config/consts';

// no endpoints in this file

// For use in queries with find()
export function buildFindObject(query: QueryFilters): FilterQuery<FilterMongo> {
  const findObject: FilterQuery<FilterMongo> = {};
  if (query.yearStart) {
    findObject.yearPublished = findObject.yearPublished || {};
    findObject.yearPublished.$gte = parseInt(query.yearStart);
  }
  if (query.yearEnd) {
    findObject.yearPublished = findObject.yearPublished || {};
    findObject.yearPublished.$lte = parseInt(query.yearEnd);
  }
  if (query.authorIds) {
    findObject.authorIds = {
      $in: JSON.parse(query.authorIds).map((author: string) => new mongoose.Types.ObjectId(author)),
    };
  }
  if (query.venueIds) {
    findObject.venueId = {
      $in: JSON.parse(query.venueIds).map((venue: string) => new mongoose.Types.ObjectId(venue)),
    };
  }
  if (query.openAccess) {
    findObject.openAccess = query.openAccess === 'true';
  }
  if (query.typesOfPaper) {
    findObject.typeOfPaper = {
      $in: JSON.parse(query.typesOfPaper),
    };
  }
  if (query.fieldsOfStudy) {
    findObject.fieldsOfStudy = {
      $in: JSON.parse(query.fieldsOfStudy),
    };
  }
  if (query.publishers) {
    findObject.publisher = {
      $in: JSON.parse(query.publishers),
    };
  }
  if (query.citationsMin) {
    findObject.inCitationsCount = findObject.inCitationsCount || {};
    findObject.inCitationsCount.$gte = parseInt(query.citationsMin);
  }
  if (query.citationsMax) {
    findObject.inCitationsCount = findObject.inCitationsCount || {};
    findObject.inCitationsCount.$lte = parseInt(query.citationsMax);
  }
  return findObject;
}

export function getMatchObject(findObject: FilterQuery<FilterMongo>) {
  return { $match: findObject };
}

// For use in the aggregation framework
export function buildMatchObject(query: QueryFilters) {
  const findObject: FilterQuery<FilterMongo> = buildFindObject(query);
  return getMatchObject(findObject);
}

export function buildSortObject(sortField: string, sortDirection: string) {
  if (!sortField || !sortDirection) {
    return {
      $skip: 0,
    };
  } else {
    let direction: number;
    if (sortDirection === 'asc') {
      direction = 1;
    } else {
      direction = -1;
    }
    const sort: { [key: string]: number } = {};
    sort[sortField] = direction;
    return {
      $sort: sort,
    };
  }
}

export function fixYearData(
  data: DatapointsOverTime,
  filterYearStart: string | undefined,
  filterYearEnd: string | undefined
) {
  // fill missing years with 0s and remove years that are incorrect in the data
  const min = 1936;
  const max = 2022;
  const start =
    filterYearStart && parseInt(filterYearStart) >= min ? parseInt(filterYearStart) : min;
  const end = filterYearEnd && parseInt(filterYearEnd) <= max ? parseInt(filterYearEnd) : max;
  const entries = end - start;

  let naValue = 0;
  let offset = 0;
  for (const i in data.years) {
    const year = data.years[i];
    if (!year || year < min) {
      offset += 1;
      naValue += data.counts[i];
    } else {
      break;
    }
  }
  data.years.splice(0, offset);
  data.counts.splice(0, offset);

  for (let i = 0; i <= entries; i++) {
    const year = start + i;
    if (data.years[i] !== year) {
      data.years.splice(i, 0, year);
      data.counts.splice(i, 0, 0);
    }
  }
  if (offset > 0) {
    data.years.splice(0, 0, NA);
    data.counts.splice(0, 0, naValue);
  }
  return data;
}

// if there are only a handful of data points, the index can go out of bounds
export function quartilePosition(rowCount: number, multiplier: number): number {
  if (multiplier === 1.0) {
    return rowCount - 1;
  }
  if (multiplier === 0.0) {
    return 0;
  }
  const rounded = Math.round(rowCount * multiplier);
  if (rounded >= rowCount) {
    return rowCount - 1;
  } else {
    return rounded;
  }
}

export function computeQuartiles(quartileData: { count: number }[]): number[] {
  const rowCount = quartileData.length;
  if (rowCount === 0) {
    return [0, 0, 0, 0, 0];
  } else {
    return [0, 0.25, 0.5, 0.75, 1.0].map(
      (multiplier) => quartileData[quartilePosition(rowCount, multiplier)].count
    );
  }
}
