const esClient = require('../config/elasticsearch');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const logger = require('../utils/logger');


async function createMovieIndex() {
  const indexExists = await esClient.indices.exists({ index: 'movies' });
  if (!indexExists) {
    await esClient.indices.create({
      index: 'movies',
      body: {
        mappings: {
          properties: {
            title: { type: 'text' },
            description: { type: 'text' },
            language: { type: 'keyword' },
            genre: { type: 'keyword' },
            releaseDate: { type: 'date' },
            status: { type: 'keyword' },
            title_suggest: { type: 'completion' }
          }
        }
      }
    });
    logger.info('Movie index created ');
  }
}

async function createTheaterIndex() {
  const indexExists = await esClient.indices.exists({ index: 'theaters' });
  if (!indexExists) {
    await esClient.indices.create({
      index: 'theaters',
      body: {
        mappings: {
          properties: {
            name: { type: 'text' },
            city: { type: 'keyword' },
            address: { type: 'text' },
            location: { type: 'geo_point' }
          }
        }
      }
    });
    logger.info('Theater index created ');
  }
}

async function syncMovies() {
  const movies = await Movie.find();
  for (let movie of movies) {
    await esClient.index({
      index: 'movies',
      id: movie._id.toString(),
      body: {
        title: movie.title,
        description: movie.description,
        language: movie.language,
        genre: movie.genre,
        releaseDate: movie.releaseDate,
        status: movie.status,
        title_suggest: movie.title 
      }
    });
  }
  logger.info('Movies sync to Elasticsearch');
}

async function syncTheaters() {
  const theaters = await Theater.find().populate('city');
  for (let theater of theaters) {
    await esClient.index({
      index: 'theaters',
      id: theater._id.toString(),
      body: {
        name: theater.name,
        city: theater.city.name,
        address: theater.address,
        location: {
          lat: theater.location.coordinates[1],
          lon: theater.location.coordinates[0]
        }
      }
    });
  }
  logger.info('Theaters synced to Elasticsearch');
}

async function main() {
  try {
    await createMovieIndex();
    await createTheaterIndex();
    await syncMovies();
    await syncTheaters();
    logger.info('Elasticsearch indexing done');
    process.exit(0);
  } catch (err) {
    logger.error('Error:', err);
    process.exit(1);
  }
}

main();
