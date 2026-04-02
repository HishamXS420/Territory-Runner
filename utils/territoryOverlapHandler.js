const Territory = require('../models/Territory');
const UserStatistics = require('../models/UserStatistics');
const geoUtils = require('./geoUtils');

/**
 * Handle territory overlap when a new territory is created.
 * For each existing territory that overlaps:
 *   - Subtract the overlapping region from the old owner's polygon & stats
 *   - The new territory already contains the full area (no extra addition needed)
 *
 * @param {Object} newTerritory - The newly saved Mongoose Territory document
 * @param {string} newUserId    - The ObjectId string of the user who created it
 */
async function handleTerritoryOverlap(newTerritory, newUserId) {
  try {
    const newPolygon = geoUtils.coordinatesToPolygon(newTerritory.polygonCoords);

    // Fetch all territories EXCEPT the one just created
    const allTerritories = await Territory.find({
      _id: { $ne: newTerritory._id },
    }).lean();

    for (const existing of allTerritories) {
      // Skip territories owned by the same user
      if (String(existing.userId) === String(newUserId)) continue;

      if (!Array.isArray(existing.polygonCoords) || existing.polygonCoords.length < 3) continue;

      let existingPolygon;
      try {
        existingPolygon = geoUtils.coordinatesToPolygon(existing.polygonCoords);
      } catch (e) {
        console.warn('⚠️ Could not parse existing territory polygon, skipping:', existing._id);
        continue;
      }

      const hasOverlap = geoUtils.checkOverlap(newPolygon, existingPolygon);
      if (!hasOverlap) continue;

      const overlapArea = geoUtils.calculateOverlappingArea(newPolygon, existingPolygon);
      if (!overlapArea || overlapArea <= 0) continue;

      console.log(`⚔️ Overlap detected: ${overlapArea.toFixed(2)} m² between new territory and territory ${existing._id}`);

      // Subtract the new polygon from the old territory's polygon
      const remainingPolygon = geoUtils.subtractPolygon(existingPolygon, newPolygon);

      if (!remainingPolygon) {
        // Entire old territory is consumed — delete it
        await Territory.findByIdAndDelete(existing._id);
        console.log(`🗑️ Territory ${existing._id} fully consumed and deleted`);

        // Deduct entire old area from old owner's stats
        await UserStatistics.findOneAndUpdate(
          { userId: existing.userId },
          { $inc: { totalTerritoryArea: -existing.area } }
        );
      } else {
        // Partial overlap — update the old territory's polygon and area
        const remainingCoords = remainingPolygon.geometry.coordinates[0].map(
          coord => [coord[1], coord[0]]  // [lon, lat] → [lat, lon]
        );
        const remainingArea = geoUtils.calculateArea(remainingPolygon);
        const newCenter = geoUtils.calculateCenterPoint(remainingPolygon);

        await Territory.findByIdAndUpdate(existing._id, {
          polygonCoords: remainingCoords,
          area: remainingArea,
          centerLat: newCenter.lat,
          centerLon: newCenter.lon,
        });

        console.log(`✂️ Territory ${existing._id} trimmed. Remaining: ${remainingArea.toFixed(2)} m²`);

        // Deduct overlap area from old owner's stats
        await UserStatistics.findOneAndUpdate(
          { userId: existing.userId },
          { $inc: { totalTerritoryArea: -overlapArea } }
        );
      }

      console.log(`✅ ${overlapArea.toFixed(2)} m² transferred from user ${existing.userId} to user ${newUserId}`);
    }
  } catch (error) {
    console.error('❌ Error handling territory overlap:', error.message);
    throw error;
  }
}

module.exports = { handleTerritoryOverlap };
