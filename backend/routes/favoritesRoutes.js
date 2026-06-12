const express = require('express');
const router = express.Router();
const { toggleFavorite, getFavorites } = require('../controllers/favoritesController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',          protect, getFavorites);
router.post('/:boxId',  protect, toggleFavorite);

module.exports = router;
