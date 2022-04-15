import mongoose from 'mongoose';
import { FilterMongo, FilterQuery } from '../../../types';

// no endpoints in this file
// For use in the "aggregate" framework
export function buildMatchObject(query: FilterQuery) {
  const matchObject: FilterMongo = {};
  if (query.yearStart) {
    matchObject.datePublished = matchObject.datePublished || {};
    matchObject.datePublished.$gt = new Date(query.yearStart);
  }
  if (query.yearEnd) {
    matchObject.datePublished = matchObject.datePublished || {};
    matchObject.datePublished.$lt = new Date('' + (parseInt(query.yearEnd) + 1));
  }
  if (query.author && query.author != 'null') {
    matchObject.authors = new mongoose.Types.ObjectId(query.author);
  }
  if (query.venue && query.venue != 'null') {
    matchObject.venues = new mongoose.Types.ObjectId(query.venue);
  }
  return { $match: matchObject };
}
