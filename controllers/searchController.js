// const Movie = require('../models/Movie');
// const Theater = require('../models/Theater');
// const { successResponse } = require('../utils/responseHandler');

// exports.searchMovies = async (req, res, next) => {
//   try {
//     const { q, language, genre, city } = req.query;
//     const filter = {};

//     if (q) {
//       filter.$or = [
//         { title: { $regex: q, $options: 'i' } },
//         { description: { $regex: q, $options: 'i' } }
//       ];
//     }

//     if (language) filter.language = language;
//     if (genre) filter.genre = genre;

//     const movies = await Movie.find(filter);
//     successResponse(res, 200, 'Movies found', { movies });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.searchTheaters = async (req, res, next) => {
//   try {
//     const { q, city } = req.query;
//     const filter = {};

//     if (q) {
//       filter.name = { $regex: q, $options: 'i' };
//     }

//     if (city) filter.city = city;

//     const theaters = await Theater.find(filter).populate('city');
//     successResponse(res, 200, 'Theaters found', { theaters });
//   } catch (error) {
//     next(error);
//   }
// };



const esClient = require('../config/elasticsearch');
const { successResponse } = require('../utils/responseHandler');
const { fallbackToDBSearch } = require('../helper/helperFunction');


exports.searchMovies = async (req, res, next) => {
  try {
    const { q, language, genre, page = 1, size = 10 } = req.query;
    const from = (page - 1) * size;
    
    const must = [];
    const should = [];
    const filter = [];

    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: [
            'title^3',        
            'description^2',
            'cast^1.5',
            'director^1.5'
          ],
          fuzziness: 'AUTO',
          prefix_length: 2
        }
      });
    }

    
    if (language) filter.push({ term: { language } });
    if (genre) filter.push({ term: { genre } });
    
    filter.push({ 
      terms: { 
        status: ['UPCOMING', 'NOW_SHOWING'] 
      } 
    });

    let searchResponse;
    try {
      searchResponse = await esClient.search({
        index: 'movies',
        from,
        size,
        body: {
          query: {
            bool: {
              must: must.length > 0 ? must : [{ match_all: {} }],
              filter,
              should
            }
          },
          sort: [
            { _score: { order: 'desc' } },
            { releaseDate: { order: 'desc' } }
          ],
          aggs: {
            languages: { terms: { field: 'language' } },
            genres: { terms: { field: 'genre' } }
          }
        }
      });
    } catch (esError) {
      logger.warn('Elasticsearch unavailable, falling back to MongoDB');
      return await fallbackToDBSearch(req, res);
    }

    const movies = searchResponse.hits.hits.map(hit => ({
      id: hit._id,
      score: hit._score,
      ...hit._source
    }));

    const pagination = {
      page: parseInt(page),
      size: parseInt(size),
      total: searchResponse.hits.total.value,
      pages: Math.ceil(searchResponse.hits.total.value / size)
    };

    successResponse(res, 200, 'Movies found', { 
      movies, 
      pagination,
      aggregations: searchResponse.aggregations 
    });

  } catch (error) {
    next(error);
  }
};


exports.autocompleteMovies = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return successResponse(res, 200, 'No query', { suggestions: [] });

    const response = await esClient.search({
      index: 'movies',
      body: {
        suggest: {
          movie_suggest: {
            prefix: q,
            completion: {
              field: 'title_suggest',
              fuzzy: { fuzziness: 'auto' },
              size: 10
            }
          }
        }
      }
    });

    const suggestions = response.suggest.movie_suggest[0].options.map(opt => opt.text);

    successResponse(res, 200, 'Suggestions', { suggestions });

  } catch (error) {
    next(error);
  }
};

exports.searchTheaters = async (req, res, next) => {
  try {
    const { q, city, lat, lon } = req.query;
    const must = [];

    if (q) must.push({ match: { name: q } });
    if (city) must.push({ term: { city } });
    if (lat && lon) {
      must.push({
        geo_distance: {
          distance: '10km',
          location: { lat: parseFloat(lat), lon: parseFloat(lon) }
        }
      });
    }

    const { hits } = await esClient.search({
      index: 'theaters',
      body: { query: { bool: { must } } }
    });

    const theaters = hits.hits.map(hit => ({ id: hit._id, ...hit._source }));
    successResponse(res, 200, 'Theaters found', { theaters });
  } catch (error) {
    next(error);
  }
};
