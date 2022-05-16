import mongoose from 'mongoose';
import { FilterMongo, FilterQuery } from '../../../types';

// no endpoints in this file

//For use in queries with find()
export function buildFindObject(query: FilterQuery) {
  const findObject: FilterMongo = {};
  if (query.yearStart) {
    findObject.datePublished = findObject.datePublished || {};
    findObject.datePublished.$gte = new Date(query.yearStart);
  }
  if (query.yearEnd) {
    findObject.datePublished = findObject.datePublished || {};
    findObject.datePublished.$lt = new Date('' + (parseInt(query.yearEnd) + 1));
  }
  if (query.author) {
    findObject.authors = new mongoose.Types.ObjectId(query.author);
  }
  if (query.venue) {
    findObject.venues = new mongoose.Types.ObjectId(query.venue);
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
