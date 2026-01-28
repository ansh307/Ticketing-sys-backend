// const mongoose = require('mongoose');
// const { MOVIE_STATUS } = require('../config/constants');

// const movieSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   slug: {
//     type: String,
//     unique: true
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   duration: {
//     type: Number,
//     required: true
//   },
//   releaseDate: {
//     type: Date,
//     required: true
//   },
//   language: [String],
//   genre: [String],
//   rating: {
//     type: String,
//     enum: ['U', 'UA', 'A', 'R'],
//     required: true
//   },
//   poster: String,
//   trailer: String,
//   cast: [String],
//   director: String,
//   status: {
//     type: String,
//     enum: Object.values(MOVIE_STATUS),
//     default: MOVIE_STATUS.UPCOMING
//   },
//   averageRating: {
//     type: Number,
//     default: 0
//   },
//   totalReviews: {
//     type: Number,
//     default: 0
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('Movie', movieSchema);


const mongoose = require('mongoose');
const { MOVIE_STATUS } = require('../config/constants');
const esClient = require('../config/elasticsearch');
const logger = require('../utils/logger');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  releaseDate: {
    type: Date,
    required: true
  },
  language: [String],
  genre: [String],
  rating: {
    type: String,
    enum: ['U', 'UA', 'A', 'R'],
    required: true
  },
  poster: String,
  trailer: String,
  cast: [String],
  director: String,
  status: {
    type: String,
    enum: Object.values(MOVIE_STATUS),
    default: MOVIE_STATUS.UPCOMING
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const syncMovieToElasticsearch = async (movieDoc) => {
  try {
    if (!movieDoc) {
      logger.warn('No movie document provided for Elasticsearch sync');
      return;
    }

    const movieData = {
      title: movieDoc.title,
      description: movieDoc.description,
      language: movieDoc.language || [],
      genre: movieDoc.genre || [],
      releaseDate: movieDoc.releaseDate,
      status: movieDoc.status,
      cast: movieDoc.cast || [],
      director: movieDoc.director || '',
      poster: movieDoc.poster || '',
      rating: movieDoc.rating,
      duration: movieDoc.duration,
      averageRating: movieDoc.averageRating || 0,
      totalReviews: movieDoc.totalReviews || 0,
      createdAt: movieDoc.createdAt,
      updatedAt: movieDoc.updatedAt,
      title_suggest: movieDoc.title // For autocomplete
    };

    await esClient.index({
      index: 'movies',
      id: movieDoc._id.toString(),
      body: movieData,
      refresh: false // Better performance
    });

    logger.info(`Movie synced to Elasticsearch: ${movieDoc.title} (${movieDoc._id})`);
  } catch (error) {
    logger.error('Failed to sync movie to Elasticsearch:', {
      movieId: movieDoc?._id,
      error: error.message,
      stack: error.stack
    });
  }
};

const deleteMovieFromElasticsearch = async (movieDoc) => {
  try {
    if (!movieDoc) {
      logger.warn('No movie document provided for Elasticsearch deletion');
      return;
    }

    await esClient.delete({
      index: 'movies',
      id: movieDoc._id.toString(),
      refresh: false
    });

    logger.info(`Movie deleted from Elasticsearch: ${movieDoc._id}`);
  } catch (error) {
    // If document not found in ES, it's okay - just log
    if (error.statusCode === 404) {
      logger.info(`Movie not found in Elasticsearch for deletion: ${movieDoc._id}`);
      return;
    }
    
    logger.error('Failed to delete movie from Elasticsearch:', {
      movieId: movieDoc?._id,
      error: error.message
    });
  }
};


movieSchema.post('save', async function(doc) {
  logger.info(`Post-save hook triggered for movie: ${doc.title}`);
  await syncMovieToElasticsearch(doc);
});

movieSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    logger.info(`Post-findOneAndUpdate hook triggered for movie: ${doc.title}`);
    await syncMovieToElasticsearch(doc);
  }
});


movieSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    logger.info(`Post-findOneAndDelete hook triggered for movie: ${doc.title}`);
    await deleteMovieFromElasticsearch(doc);
  }
});


module.exports = mongoose.model('Movie', movieSchema);