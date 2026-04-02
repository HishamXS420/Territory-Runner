const RunningSession = require('../models/RunningSession');
const RouteCoordinate = require('../models/RouteCoordinate');
const User = require('../models/User');
const UserStatistics = require('../models/UserStatistics');
const Territory = require('../models/Territory');
const geoUtils = require('../utils/geoUtils');
const { handleTerritoryOverlap } = require('../utils/territoryOverlapHandler');

// Start a running session
exports.startSession = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🏃 Starting running session for user:', userId);

    // Create new running session
    const session = new RunningSession({
      userId: userId,
      startTime: new Date(),
    });

    const savedSession = await session.save();

    console.log('✅ Running session started:', savedSession._id);

    res.status(201).json({
      message: 'Running session started.',
      sessionId: savedSession._id,
      startTime: savedSession.startTime,
    });
  } catch (error) {
    console.error('❌ Error starting session:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Add route coordinate during run
exports.addCoordinate = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    console.log('📍 Recording coordinate for session:', sessionId, { latitude, longitude });

    // Validate input
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    // Verify session exists
    const session = await RunningSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Create coordinate record
    const coordinate = new RouteCoordinate({
      runningSessionId: sessionId,
      latitude: latitude,
      longitude: longitude,
      recordedAt: new Date(),
    });

    const savedCoordinate = await coordinate.save();

    console.log('✅ Coordinate recorded:', savedCoordinate._id);

    res.json({ message: 'Coordinate recorded.', coordinate: savedCoordinate });
  } catch (error) {
    console.error('❌ Error adding coordinate:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Pause session (no action needed, just acknowledge)
exports.pauseSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log('⏸️ Pausing session:', sessionId);

    // Verify session exists
    const session = await RunningSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    console.log('✅ Session paused');

    // Session still exists but tracking is paused (client-side)
    res.json({ message: 'Session paused.' });
  } catch (error) {
    console.error('❌ Error pausing session:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Finish running session
exports.finishSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    console.log('🏁 Finishing session:', sessionId, 'for user:', userId);

    // Get the session
    const session = await RunningSession.findById(sessionId);
    if (!session) {
      console.log('❌ Session not found:', sessionId);
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Get all coordinates for this session
    const coordinateRows = await RouteCoordinate.find({ runningSessionId: sessionId })
      .sort({ recordedAt: 1 })
      .lean();

    if (!coordinateRows || coordinateRows.length === 0) {
      console.log('⚠️ No coordinates recorded for session:', sessionId);
      return res.status(400).json({ message: 'No coordinates recorded for this session.' });
    }

    console.log('📊 Total coordinates recorded:', coordinateRows.length);

    // Convert to coordinate array [lat, lon]
    const coordinates = coordinateRows.map(row => [row.latitude, row.longitude]);

    // Calculate stats
    const endTime = new Date();
    const timeInSeconds = Math.floor((endTime - session.startTime) / 1000);
    const stats = geoUtils.calculateRunningStats(coordinates, timeInSeconds);

    console.log('📈 Stats calculated:', { distance: stats.distance, time: timeInSeconds, calories: stats.calories });

    let territoryId = null;
    let territoryArea = 0;
    let isClosedLoop = false;
    let centerPoint = null;

    // Only check for territory if we have 3 or more coordinate points
    if (coordinates.length >= 3) {
      // Check if it's a closed loop
      isClosedLoop = geoUtils.isClosedLoop(coordinates);

      console.log('🔄 Closed loop check:', isClosedLoop);

      if (isClosedLoop) {
        try {
          const polygon = geoUtils.coordinatesToPolygon(coordinates);
          territoryArea = geoUtils.calculateArea(polygon);
          centerPoint = geoUtils.calculateCenterPoint(polygon);
          console.log('🗺️ Territory detected - Area:', territoryArea, 'Center:', centerPoint);
        } catch (error) {
          console.error('⚠️ Error preparing territory geometry:', error.message);
          isClosedLoop = false;
          territoryArea = 0;
          centerPoint = null;
        }
      }
    }

    let updatedSession;
    let createdTerritory = null;

    try {
      // 1) Update running session with final stats
      updatedSession = await RunningSession.findByIdAndUpdate(
        sessionId,
        {
          endTime: endTime,
          isClosedLoop: isClosedLoop,
          totalDistance: stats.distance,
          totalTime: timeInSeconds,
          estimatedCalories: stats.calories,
        },
        { new: true }
      );

      console.log('✅ Session updated with stats');

      // 2) Update user statistics (running aggregates)
      let userStats = await UserStatistics.findOne({ userId: userId });

      if (!userStats) {
        // Create if not exists
        userStats = new UserStatistics({
          userId: userId,
          totalDistance: stats.distance,
          totalTime: timeInSeconds,
          totalCalories: stats.calories,
          totalRunningSessions: 1,
        });
      } else {
        // Update existing
        userStats.totalDistance += stats.distance;
        userStats.totalTime += timeInSeconds;
        userStats.totalCalories += stats.calories;
        userStats.totalRunningSessions += 1;
      }

      await userStats.save();
      console.log('✅ User statistics updated');

      // 3) Save territory if loop is closed
      if (isClosedLoop && territoryArea > 0 && centerPoint) {
        createdTerritory = new Territory({
          userId: userId,
          runningSessionId: sessionId,
          polygonCoords: coordinates,
          area: territoryArea,
          centerLat: centerPoint.lat,
          centerLon: centerPoint.lon,
        });

        await createdTerritory.save();
        territoryId = createdTerritory._id;

        // Update territory area in user statistics
        userStats.totalTerritoryArea += territoryArea;
        await userStats.save();

        console.log('✅ Territory created:', territoryId, 'Area:', territoryArea);
      }
    } catch (error) {
      console.error('❌ Error during session finish:', error.message);
      throw error;
    }

    // Handle overlap after successful core transaction (non-blocking)
    if (createdTerritory) {
      try {
        await handleTerritoryOverlap(createdTerritory, userId);
      } catch (overlapError) {
        console.error('⚠️ Territory overlap post-processing failed:', overlapError.message);
      }
    }

    console.log('✅ Session finish complete');

    res.json({
      message: 'Session finished.',
      session: updatedSession,
      stats,
      isClosedLoop,
      territoryCreated: !!createdTerritory,
      territoryId: territoryId,
      territoryArea: territoryArea,
    });
  } catch (error) {
    console.error('❌ Error finishing session:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get session details
exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log('🔍 Fetching session details:', sessionId);

    const session = await RunningSession.findById(sessionId);
    if (!session) {
      console.log('❌ Session not found:', sessionId);
      return res.status(404).json({ message: 'Session not found.' });
    }

    const coordinates = await RouteCoordinate.find({ runningSessionId: sessionId })
      .sort({ recordedAt: 1 })
      .lean();

    console.log('✅ Session details fetched');

    res.json({ session, coordinates });
  } catch (error) {
    console.error('❌ Error fetching session:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get user's running history
exports.getRunHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('📜 Fetching run history for user:', userId);

    const sessions = await RunningSession.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log('✅ Run history fetched:', sessions.length, 'sessions');

    res.json({ sessions });
  } catch (error) {
    console.error('❌ Error fetching run history:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
