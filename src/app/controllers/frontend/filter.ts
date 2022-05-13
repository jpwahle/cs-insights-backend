import mongoose from 'mongoose';
import { FilterMongo, FilterQuery } from '../../../types';

// no endpoints in this file

// For use in queries with find()
export function buildFindObject(query: FilterQuery) {
  console.log(query);
  const findObject: FilterMongo = {};
  if (query.yearStart) {
    findObject.datePublished = findObject.datePublished || {};
    findObject.datePublished.$gt = new Date(query.yearStart);
  }
  if (query.yearEnd) {
    findObject.datePublished = findObject.datePublished || {};
    findObject.datePublished.$lt = new Date('' + (parseInt(query.yearEnd) + 1));
  }
  if (query.authors) {
    findObject.authors = {
      $in: JSON.parse(query.authors).map((author: string) => new mongoose.Types.ObjectId(author)),
    };
  }
  if (query.venues) {
    findObject.venues = {
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
