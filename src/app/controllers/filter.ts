// no endpoints

// @ts-nocheck
export function buildAggregateFilterObject(query) {
  const obj = {};
  if (query.yearStart) {
    obj.datePublished.$gt = new Date(query.yearStart);
  }
  if (query.yearEnd) {
    obj.datePublished.$lt = new Date(parseInt(query.yearEnd) + 1);
  }
  if (query.author) {
  }
  obj.console.log(query);
  return { $match: obj };
}
