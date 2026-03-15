const turf = require('@turf/turf');

// Validate if a running path forms a closed loop
const isClosedLoop = (coordinates) => {
  const validCoordinates = coordinates.filter(coord => coord[0] !== 999);
  if (validCoordinates.length < 2) return false;

  const startPoint = validCoordinates[0];
  const endPoint = validCoordinates[validCoordinates.length - 1];

  // Convert to GeoJSON points
  const start = turf.point([startPoint[1], startPoint[0]]);
  const end = turf.point([endPoint[1], endPoint[0]]);

  // Calculate distance in meters
  const distance = turf.distance(start, end, { units: 'meters' });

  return distance <= 50; // Closed loop if within 50 meters
};

// Convert coordinates array to polygon
const coordinatesToPolygon = (coordinates) => {
  // Filter out gap markers used for paused states 
  const validCoordinates = coordinates.filter(coord => coord[0] !== 999);
  
  if (!validCoordinates || validCoordinates.length < 3) {
    throw new Error('At least 3 valid coordinate points are required to create a polygon');
  }

  // Ensure the polygon is closed by adding the first point at the end
  const polygonCoords = validCoordinates.map(coord => [coord[1], coord[0]]);
  if (polygonCoords.length > 2 && 
      (polygonCoords[0][0] !== polygonCoords[polygonCoords.length - 1][0] ||
       polygonCoords[0][1] !== polygonCoords[polygonCoords.length - 1][1])) {
    polygonCoords.push(polygonCoords[0]);
  }
  
  try {
    return turf.polygon([polygonCoords]);
  } catch (error) {
    console.error('Error creating polygon:', error);
    throw new Error('Failed to create polygon from coordinates');
  }
};

// Calculate area from polygon in square meters
const calculateArea = (polygon) => {
  try {
    const area = turf.area(polygon);
    if (!area || isNaN(area) || area < 0) {
      throw new Error('Invalid area calculation');
    }
    return area; // Returns square meters
  } catch (error) {
    console.error('Error calculating area:', error);
    return 0; // Return 0 as safe default
  }
};

// Calculate center point of polygon
const calculateCenterPoint = (polygon) => {
  try {
    const center = turf.center(polygon);
    if (!center || !center.geometry.coordinates) {
      throw new Error('Failed to calculate center point');
    }
    return {
      lat: center.geometry.coordinates[1],
      lon: center.geometry.coordinates[0],
    };
  } catch (error) {
    console.error('Error calculating center point:', error);
    // Return approximate center if calculation fails
    return {
      lat: 0,
      lon: 0,
    };
  }
};

// Check if two territories overlap
const checkOverlap = (polygon1, polygon2) => {
  try {
    const intersection = turf.intersect(polygon1, polygon2);
    return intersection !== null;
  } catch (error) {
    console.error('Error checking overlap:', error);
    return false;
  }
};

// Calculate overlapping area between two territories
const calculateOverlappingArea = (polygon1, polygon2) => {
  try {
    const intersection = turf.intersect(polygon1, polygon2);
    if (!intersection) return 0;
    return turf.area(intersection);
  } catch (error) {
    console.error('Error calculating overlapping area:', error);
    return 0;
  }
};

// Remove overlapping part from a polygon
const subtractPolygon = (polygon1, polygon2) => {
  try {
    // Using difference to remove polygon2 from polygon1
    const difference = turf.difference(polygon1, polygon2);
    return difference;
  } catch (error) {
    console.error('Error calculating difference:', error);
    return polygon1;
  }
};

// Calculate running statistics
const calculateRunningStats = (coordinates, timeInSeconds) => {
  let totalDistance = 0;

  // Calculate distance between consecutive points
  for (let i = 0; i < coordinates.length - 1; i++) {
    // Skip calculation across breaks (marked by [999, 999] or similar indicator)
    if (coordinates[i][0] === 999 || coordinates[i + 1][0] === 999) continue;
    
    const point1 = turf.point([coordinates[i][1], coordinates[i][0]]);
    const point2 = turf.point([coordinates[i + 1][1], coordinates[i + 1][0]]);
    const distance = turf.distance(point1, point2, { units: 'kilometers' });
    totalDistance += distance;
  }

  // Estimate calories burned (average 0.63 calories per kg per km)
  // Assuming average user weight of 70kg
  const estimatedCalories = Math.round(totalDistance * 70 * 0.63);

  return {
    distance: parseFloat(totalDistance.toFixed(4)), // in kilometers
    calories: estimatedCalories,
    time: timeInSeconds,
  };
};

module.exports = {
  isClosedLoop,
  coordinatesToPolygon,
  calculateArea,
  calculateCenterPoint,
  checkOverlap,
  calculateOverlappingArea,
  subtractPolygon,
  calculateRunningStats,
};
