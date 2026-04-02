const mongoose = require('mongoose');

const routeCoordinateSchema = new mongoose.Schema(
  {
    runningSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RunningSession',
      required: [true, 'Running Session ID is required'],
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

routeCoordinateSchema.index({ runningSessionId: 1, recordedAt: 1 });

module.exports = mongoose.model('RouteCoordinate', routeCoordinateSchema);
