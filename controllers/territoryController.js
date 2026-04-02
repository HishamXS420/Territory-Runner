const Territory = require('../models/Territory');
const User = require('../models/User');
const geoUtils = require('../utils/geoUtils');

// Get all territories
exports.getAllTerritories = async (req, res) => {
  try {
    console.log('📍 Fetching all territories');

    const raw = await Territory.find().populate('userId', 'username').lean();

    // Flatten so frontend always gets consistent structure
    const territories = raw.map(t => ({
      _id: t._id,
      userId: t.userId?._id || t.userId,
      username: t.userId?.username || 'Unknown',
      polygonCoords: t.polygonCoords,
      area: t.area,
      centerLat: t.centerLat,
      centerLon: t.centerLon,
      createdAt: t.createdAt,
    }));

    console.log('✅ Found territories:', territories.length);

    res.json({ territories });
  } catch (error) {
    console.error('❌ Error fetching territories:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get territories in a bounding box
exports.getTerritoriesInBounds = async (req, res) => {
  try {
    const { minLat, maxLat, minLon, maxLon } = req.query;

    console.log('📦 Fetching territories in bounds:', { minLat, maxLat, minLon, maxLon });

    const territories = await Territory.find({
      centerLat: { $gte: minLat, $lte: maxLat },
      centerLon: { $gte: minLon, $lte: maxLon },
    }).populate('userId', 'username');

    console.log('✅ Found territories in bounds:', territories.length);

    res.json({ territories });
  } catch (error) {
    console.error('❌ Error fetching territories in bounds:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get user's territories
exports.getUserTerritories = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('👤 Fetching territories for user:', userId);

    const territories = await Territory.find({ userId: userId }).sort({ createdAt: -1 });

    console.log('✅ Found territories:', territories.length);

    res.json({ territories });
  } catch (error) {
    console.error('❌ Error fetching user territories:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get territory details
exports.getTerritoryDetails = async (req, res) => {
  try {
    const { territoryId } = req.params;

    console.log('🔍 Fetching territory details:', territoryId);

    const territory = await Territory.findById(territoryId).populate('userId', 'username');
    if (!territory) {
      console.log('❌ Territory not found:', territoryId);
      return res.status(404).json({ message: 'Territory not found.' });
    }

    console.log('✅ Territory found');

    res.json({ territory });
  } catch (error) {
    console.error('❌ Error fetching territory details:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
