import { describe } from 'mocha';
import 'mocha';
import { assert } from 'chai';
import {
  buildFindObject,
  buildMatchObject,
  buildSortObject,
  fixYearData,
} from '../../../src/app/controllers/frontend/queryUtils';
import mongoose from 'mongoose';
import { NA } from '../../../src/config/consts';

process.env.NODE_ENV = 'test';

describe('queryUtils', () => {
  describe('filter', () => {
    specify('buildFindObject()', () => {
      const queryParameters = {
        yearStart: '2010',
        yearEnd: '2012',
        authors: '["1234567890ABCD0123456789"]',
        venues: '["1234567890ABCDEF01234567"]',
      };
      const findObj = buildFindObject(queryParameters);
      const expected = {
        yearPublished: {
          $gte: 2010,
          $lte: 2012,
        },
        authors: { $in: [new mongoose.Types.ObjectId('1234567890ABCD0123456789')] },
        venue: { $in: [new mongoose.Types.ObjectId('1234567890ABCDEF01234567')] },
      };
      assert.deepEqual(findObj, expected);
    });

    specify('buildFindObject() other parameters', () => {
      const queryParameters = {
        yearEnd: '2010',
        author: '',
        page: '0',
        nonsense: '12',
        otherType: 0,
      };
      const findObj = buildFindObject(queryParameters);
      const expected = {
        yearPublished: {
          $lte: 2010,
        },
      };
      assert.deepEqual(findObj, expected);
    });

    specify('buildFindObject() no filters', () => {
      const queryParameters = {
        yearStart: '',
        author: '',
      };
      const findObj = buildFindObject(queryParameters);
      const expected = {};
      assert.deepEqual(findObj, expected);
    });

    specify('buildMatchObject()', () => {
      const queryParameters = {
        yearStart: '2010',
        yearEnd: '2012',
      };
      const matchObj = buildMatchObject(queryParameters);
      const expected = {
        $match: {
          yearPublished: {
            $gte: 2010,
            $lte: 2012,
          },
        },
      };
      assert.deepEqual(matchObj, expected);
    });
  });
  describe('sort', () => {
    specify('buildSortObject() asc', () => {
      const sortObj = buildSortObject('inCitationsCount', 'asc');
      const expected = {
        $sort: {
          inCitationsCount: 1,
        },
      };
      assert.deepEqual(sortObj, expected);
    });

    specify('buildSortObject() desc', () => {
      const sortObj = buildSortObject('papers', 'desc');
      const expected = {
        $sort: {
          papers: -1,
        },
      };
      assert.deepEqual(sortObj, expected);
    });

    specify('buildSortObject() missing parameters', () => {
      const expected = {
        $skip: 0,
      };
      const sortObj = buildSortObject('cites', '');
      assert.deepEqual(sortObj, expected);

      const sortObj2 = buildSortObject('', 'desc');
      assert.deepEqual(sortObj2, expected);

      const sortObj3 = buildSortObject('', '');
      assert.deepEqual(sortObj3, expected);
    });
  });

  describe('fixYearData', () => {
    specify('No changes', () => {
      const data = { years: [1990, 1991, 1992], counts: [0, 1, 2] };
      const fixedData = fixYearData(data, '1990', '1992');
      assert.deepEqual(fixedData, data);
    });

    specify('Fill years (with filter)', () => {
      const data = { years: [1990, 1992], counts: [0, 2] };
      const fixedData = fixYearData(data, '1990', '1992');
      const expected = { years: [1990, 1991, 1992], counts: [0, 0, 2] };
      assert.deepEqual(fixedData, expected);
    });

    specify('Remove incorrect years', () => {
      const data = { years: [null, 1863, 1990, 1991, 1992], counts: [3, 1, 0, 1, 2] };
      const fixedData = fixYearData(data, undefined, undefined);
      assert.equal(fixedData.years.length, 2022 - 1936 + 2);
      assert.equal(fixedData.years[0], NA);
      assert.equal(fixedData.counts[0], 4);
    });
  });
});
