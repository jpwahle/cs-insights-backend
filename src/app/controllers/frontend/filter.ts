import mongoose from 'mongoose';
import { FilterMongo, FilterQuery } from '../../../types';

// no endpoints in this file

//For use in queries with find()
export function buildFindObject(query: FilterQuery) {
  const findObject: FilterMongo = {};
  if (query.yearStart) {
    findObject.datePublished = findObject.datePublished || {};
    findObject.datePublished.$gt = new Date(query.yearStart);
  }
  if (query.yearEnd) {
    findObject.datePublished = findObject.datePublished || {};
    findObject.datePublished.$lt = new Date('' + (parseInt(query.yearEnd) + 1));
  }
  if (query.author && query.author != 'null') {
    findObject.authors = new mongoose.Types.ObjectId(query.author);
  }
  if (query.venue && query.venue != 'null') {
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
