const mongoose = require('mongoose');

const territorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    runningSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RunningSession',
      required: [true, 'Running Session ID is required'],
    },
    polygonCoords: {
      type: Array,
      required: [true, 'Polygon coordinates are required'],
    },
    area: {
      type: Number,
      required: [true, 'Area is required'],
    },
    centerLat: {
      type: Number,
      required: [true, 'Center latitude is required'],
    },
    centerLon: {
      type: Number,
      required: [true, 'Center longitude is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

territorySchema.index({ centerLat: 1, centerLon: 1 });

module.exports = mongoose.model('Territory', territorySchema);
