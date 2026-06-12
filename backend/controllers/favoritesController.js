const User = require('../models/User');

// @route   POST /api/favorites/:boxId
// @access  Private
// Toggles a box in the user's favorites array (add if missing, remove if present)
const toggleFavorite = async (req, res) => {
  try {
    const { boxId } = req.params;
    const user = await User.findById(req.user.id);

    const index = user.favorites.indexOf(boxId);
    if (index === -1) {
      user.favorites.push(boxId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      message: index === -1 ? 'Added to favorites' : 'Removed from favorites',
      favorites: user.favorites,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/favorites
// @access  Private
// Returns the user's favorites populated with box details
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favorites',
      select: 'name image basePrice dietType isActive',
    });

    res.status(200).json({ favorites: user.favorites || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { toggleFavorite, getFavorites };
