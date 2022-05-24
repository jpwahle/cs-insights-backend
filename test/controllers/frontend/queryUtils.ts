import { describe } from 'mocha';
import 'mocha';
import { assert } from 'chai';
import {
  buildFindObject,
  buildMatchObject,
  buildSortObject,
} from '../../../src/app/controllers/frontend/queryUtils';
import mongoose from 'mongoose';

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
        datePublished: {
          $gte: new Date('2010-01-01T00:00:00.000Z'),
          $lt: new Date('2013-01-01T00:00:00.000Z'),
        },
        authors: { $in: [new mongoose.Types.ObjectId('1234567890ABCD0123456789')] },
        venues: { $in: [new mongoose.Types.ObjectId('1234567890ABCDEF01234567')] },
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
        datePublished: {
          $lt: new Date('2011-01-01T00:00:00.000Z'),
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
          datePublished: {
            $gte: new Date('2010-01-01T00:00:00.000Z'),
            $lt: new Date('2013-01-01T00:00:00.000Z'),
          },
        },
      };
      assert.deepEqual(matchObj, expected);
    });
  });
  describe('sort', () => {
    specify('buildSortObject() asc', () => {
      const sortObj = buildSortObject('cites', 'asc');
      const expected = {
        $sort: {
          cites: 1,
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
});
