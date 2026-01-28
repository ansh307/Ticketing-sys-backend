const Movie = require('../models/Movie');
const mongoose = require('mongoose');
const { delCache } = require('../utils/redisCache');
const { errorResponse } = require('../utils/responseHandler');
const { successResponse } = require('../utils/responseHandler');
const { generateSlug } = require('../utils/slugGenerator');
const { setCache, getCache } = require('../utils/redisCache');
const logger = require('../utils/logger');


//old code
// exports.getAllMovies = async (req, res, next) => {
//   try {
//     const { status, language, genre } = req.query;
//     const filter = {};
    
//     if (status) filter.status = status;
//     if (language) filter.language = language;
//     if (genre) filter.genre = genre;

//     const movies = await Movie.find(filter).sort('-createdAt');
//     successResponse(res, 200, 'Movies retrieved', { movies });
//   } catch (error) {
//     next(error);
//   }
// };




exports.getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return errorResponse(res, 404, 'Movie not found');
    }
    successResponse(res, 200, 'Movie retrieved', { movie });
  } catch (error) {
    next(error);
  }
};


exports.deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return errorResponse(res, 404, 'Movie not found');
    }
    successResponse(res, 200, 'Movie deleted');
  } catch (error) {
    next(error);
  }
};




exports.getAllMovies = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const cacheKey = `movies_page_${page}_limit_${limit}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      logger.info(`Movies page ${page} fetched from cache`);
      return successResponse(res, 200, 'Movies retrieved from cache', { 
        movies: cachedData.movies,
        pagination: cachedData.pagination
      });
    }

    const [movies, total] = await Promise.all([
      Movie.find()
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Movie.countDocuments()
    ]);

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };

    const cacheData = { movies, pagination };
    await setCache(cacheKey, cacheData, 300); // 5 minutes cache

    successResponse(res, 200, 'Movies retrieved', { movies, pagination });
  } catch (error) {
    next(error);
  }
};


exports.createMovie = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      let slug = generateSlug(req.body.title);
      let counter = 1;
      let existingMovie = await Movie.findOne({ slug }).session(session);

      while (existingMovie) {
        slug = `${generateSlug(req.body.title)}-${counter}`;
        existingMovie = await Movie.findOne({ slug }).session(session);
        counter++;
      }

      const movie = await Movie.create([{ ...req.body, slug }], { session });

      await Promise.all([
        delCache('all_movies'),
        delCache(/^movies_page_/), 
        delCache('search_movies')
      ]);

      successResponse(res, 201, 'Movie created successfully', { movie: movie[0] });
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};


exports.updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return errorResponse(res, 404, 'Movie not found');
    }

    await Promise.all([
      delCache('all_movies'),
      delCache(/^movies_page_/),
      delCache(`movie:${movie._id}`)
    ]);

    successResponse(res, 200, 'Movie updated successfully', { movie });
  } catch (error) {
    next(error);
  }
};
