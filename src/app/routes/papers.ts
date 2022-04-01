//@ts-nocheck
import express from 'express';
import Models from '../models';

const router = express.Router();

const pageSize = 100;
const models = new Models();

// interface datat {
//   time: [{year: number, cites: number}],
//   total: number,
//   top: [{year: number, cites: number, title: string, venues: string}]
// }

async function pagedTop(page: number) {
  return models.Paper.aggregate([
    {
      $lookup: {
        from: 'venues',
        localField: 'venues',
        foreignField: '_id',
        as: 'venues',
      },
    },
    {
      $lookup: {
        from: 'authors',
        localField: 'authors',
        foreignField: '_id',
        as: 'authors',
      },
    },
    {
      $project: {
        year: {
          $year: '$datePublished',
        },
        cites: {
          $size: '$cites',
        },
        title: 1,
        authors: '$authors.fullname',
        venue: {
          $arrayElemAt: ['$venues.names', 0],
        },
      },
    },
    {
      $sort: {
        cites: -1,
      },
    },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
  ]);
}

router.get('/paper/stats', async (req, res) => {
  try {
    const data = {};
    data.time = await models.Paper.aggregate([
      {
        $group: {
          _id: {
            $year: '$datePublished',
          },
          cites: {
            $sum: {
              $size: '$cites',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id',
          cites: 1,
        },
      },
      {
        $sort: {
          year: 1,
        },
      },
    ]);
    data.total = await models.Paper.count();
    data.top = await pagedTop(1);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/paper', async (req, res) => {
  try {
    const data = {};
    const page = req.query.page;
    data.total = await models.Paper.count();
    data.top = await pagedTop(page);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
