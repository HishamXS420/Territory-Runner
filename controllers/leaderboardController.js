const UserStatistics = require('../models/UserStatistics');
const User = require('../models/User');


exports.getLeaderboardByArea = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    console.log(' Fetching leaderboard by area, limit:', limit);

    const raw = await UserStatistics.find()
      .sort({ totalTerritoryArea: -1 })
      .limit(limit)
      .populate('userId', 'username')
      .lean();

    const leaderboard = raw.map(entry => ({
      username: entry.userId?.username || 'Unknown',
      total_territory_area: entry.totalTerritoryArea || 0,
      total_distance: entry.totalDistance || 0,
      total_running_sessions: entry.totalRunningSessions || 0,
    }));

    console.log(' Leaderboard fetched:', leaderboard.length, 'users');

    res.json({ leaderboard });
  } catch (error) {
    console.error(' Error fetching leaderboard:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getLeaderboardByDistance = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    console.log('🏃 Fetching leaderboard by distance, limit:', limit);

    const raw = await UserStatistics.find()
      .sort({ totalDistance: -1 })
      .limit(limit)
      .populate('userId', 'username')
      .lean();

    const leaderboard = raw.map(entry => ({
      username: entry.userId?.username || 'Unknown',
      total_territory_area: entry.totalTerritoryArea || 0,
      total_distance: entry.totalDistance || 0,
      total_running_sessions: entry.totalRunningSessions || 0,
    }));

    console.log('Leaderboard fetched:', leaderboard.length, 'users');

    res.json({ leaderboard });
  } catch (error) {
    console.error(' Error fetching leaderboard:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


exports.getUserRankByArea = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(' Finding user rank by area, user:', userId);

    const userStats = await UserStatistics.findOne({ userId: userId });
    if (!userStats) {
      return res.status(404).json({ message: 'User statistics not found.' });
    }

    const rank = await UserStatistics.countDocuments({
      totalTerritoryArea: { $gt: userStats.totalTerritoryArea },
    });

    console.log(' User rank by area:', rank + 1);

    res.json({ rank: rank + 1 });
  } catch (error) {
    console.error(' Error fetching user rank:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


exports.getUserRankByDistance = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(' Finding user rank by distance, user:', userId);

    const userStats = await UserStatistics.findOne({ userId: userId });
    if (!userStats) {
      return res.status(404).json({ message: 'User statistics not found.' });
    }

    const rank = await UserStatistics.countDocuments({
      totalDistance: { $gt: userStats.totalDistance },
    });

    console.log(' User rank by distance:', rank + 1);

    res.json({ rank: rank + 1 });
  } catch (error) {
    console.error(' Error fetching user rank:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
