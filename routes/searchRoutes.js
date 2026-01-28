const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

router.get('/movies', searchController.searchMovies);
router.get('/autocomplete', searchController.autocompleteMovies);

router.get('/theaters', searchController.searchTheaters);

module.exports = router;
