import mongoose from 'mongoose';
import { DatapointsOverTime, FilterMongo, FilterQuery } from '../../../types';
import { NA } from '../../../config/consts';

// no endpoints in this file

// For use in queries with find()
export function buildFindObject(query: FilterQuery) {
  const findObject: FilterMongo = {};
  if (query.yearStart) {
    findObject.yearPublished = findObject.yearPublished || {};
    findObject.yearPublished.$gte = parseInt(query.yearStart);
  }
  if (query.yearEnd) {
    findObject.yearPublished = findObject.yearPublished || {};
    findObject.yearPublished.$lte = parseInt(query.yearEnd);
  }
  if (query.authors) {
    findObject.authors = {
      $in: JSON.parse(query.authors).map((author: string) => new mongoose.Types.ObjectId(author)),
    };
  }
  if (query.venues) {
    findObject.venue = {
      $in: JSON.parse(query.venues).map((venue: string) => new mongoose.Types.ObjectId(venue)),
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
  return findObject;
}

export function getMatchObject(findObject: FilterMongo) {
  return { $match: findObject };
}

// For use in the "aggregate" framework
export function buildMatchObject(query: FilterQuery) {
  const findObject: FilterMongo = buildFindObject(query);
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
  const start = filterYearStart ? parseInt(filterYearStart) : min;
  const end = filterYearEnd ? parseInt(filterYearEnd) : max;
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
