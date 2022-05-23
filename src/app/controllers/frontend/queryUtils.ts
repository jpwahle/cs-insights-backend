import mongoose from 'mongoose';
import { FilterMongo, FilterQuery } from '../../../types';

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
