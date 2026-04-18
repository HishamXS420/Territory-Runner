# Territory-Based Running and Fitness Tracking Application

A gamified running and fitness tracking application where users capture geographic territories through running activities.

## Features

1. **GPS-based running tracker** with route visualization
2. **Territory capture** when completing a closed running loop
3. **Map display** showing owned territories
4. **Territory challenge/takeover** functionality
5. **Leaderboard** based on captured area or distance
6. **Running statistics** (time, calories, distance)
7. **Activity history** tracking
8. **JWT-based authentication** system

## Technology Stack

1. **Backend**: Node.js, Express.js
2. **Frontend**: EJS, Leaflet.js, OpenStreetMap
3. **Database**: MongoDB
4. **Geo Processing**: Turf.js
5. **Authentication**: JWT

## Deploy Full App (Login + API + Database)

If you want `/login`, `/signup`, and all `/api/*` routes to work online, deploy this as a **Node.js server** (not GitHub Pages).

### Recommended: Render (with MongoDB)

This repository now includes `render.yaml` for Blueprint deployment.

1. Push code to your GitHub repo (`HishamXS420/Territory-Runner`)
2. In Render dashboard, click **New +** → **Blueprint**
3. Select this repository and deploy
4. After first deploy, open Render Shell for the web service and run:

```bash
node init-db.js
```

5. Open your live URL:
	1. `https://<your-service>.onrender.com/login`
	2. `https://<your-service>.onrender.com/signup`
	3. `https://<your-service>.onrender.com/`

### Important Notes

1. GitHub Pages only serves static files, so it cannot run this Express + MongoDB app.
2. Use `init-db.js` in hosted environments to create tables only.
3. Avoid `setup-db.js` in production, because it drops and recreates the database.

## Project Structure

```
├── config/
│   ├── database.js          # Database connection configuration
│   └── database.sql         # SQL schema for database setup
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── runController.js     # Running session logic
│   ├── territoryController.js # Territory management logic
│   └── leaderboardController.js # Leaderboard logic
├── models/
│   ├── User.js              # User model
│   ├── RunningSession.js    # Running session model
│   ├── RouteCoordinate.js   # Route coordinates model
│   ├── Territory.js         # Territory model
│   └── UserStatistics.js    # User statistics model
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── runRoutes.js         # Running session routes
│   ├── territoryRoutes.js   # Territory routes
│   └── leaderboardRoutes.js # Leaderboard routes
├── middleware/
│   └── authMiddleware.js    # JWT authentication middleware
├── utils/
│   └── geoUtils.js          # Geospatial utility functions
├── views/
│   ├── home.ejs             # Home page template
│   ├── run.ejs              # Run page template
│   └── leaderboard.ejs      # Leaderboard page template
├── public/
│   ├── css/
│   │   ├── style.css        # Main stylesheet
│   │   ├── run.css          # Run page styles
│   │   └── leaderboard.css  # Leaderboard styles
│   └── js/
│       ├── home.js          # Home page script
│       ├── run.js           # Run page script
│       └── leaderboard.js   # Leaderboard script
├── server.js                # Main Express server
├── package.json             # Project dependencies
├── .env                     # Environment variables (configure these)
└── README.md                # This file
```

## Installation & Setup

### Prerequisites

1. Node.js (v14 or higher)
2. MongoDB (v12 or higher)
3. Git

### 1. Clone and Setup

```bash
cd "d:\Study\4.1\Attachment\Territory App\Test4"
npm install
```

### 2. Database Setup

**Option A: Using MongoDB Command Line**

```bash
# Connect to MongoDB
psql -U mongodb

# Create database
CREATE DATABASE territory_running_app;

# Connect to the new database
\c territory_running_app

# Run the schema setup
\i config/database.sql
```

**Option B: Using Node.js Script** (Coming soon)

### 3. Configure Environment Variables

Edit `.env` file and set your configuration:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=territory_running_app
DB_USER=mongodb
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=7d

# Application URL
APP_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will be running at: `http://localhost:3000`

## API Endpoints

### Authentication

1. `POST /api/auth/register` - Register new user
2. `POST /api/auth/login` - Login user
3. `GET /api/auth/profile` - Get user profile (Protected)

### Running Sessions

1. `POST /api/run/start` - Start a running session (Protected)
2. `POST /api/run/:sessionId/coordinate` - Add GPS coordinate (Protected)
3. `POST /api/run/:sessionId/pause` - Pause session (Protected)
4. `POST /api/run/:sessionId/finish` - Finish session (Protected)
5. `GET /api/run/:sessionId` - Get session details (Protected)
6. `GET /api/run/history/all` - Get user's run history (Protected)

### Territories

1. `GET /api/territory/all` - Get all territories
2. `GET /api/territory/bounds` - Get territories in bounding box
3. `GET /api/territory/:territoryId` - Get territory details
4. `GET /api/territory/user/territories` - Get user's territories (Protected)

### Leaderboard

1. `GET /api/leaderboard/area` - Get leaderboard by territory area
2. `GET /api/leaderboard/distance` - Get leaderboard by distance
3. `GET /api/leaderboard/rank/area` - Get user's rank by area (Protected)
4. `GET /api/leaderboard/rank/distance` - Get user's rank by distance (Protected)

## Key Features Implemented

### 1. GPS Tracking
1. Continuous location tracking every 5 seconds
2. High accuracy geolocation enabled
3. Route visualization on Leaflet map

### 2. Territory Capture
1. Closed loop detection (start and end within 50 meters)
2. Polygon conversion and area calculation
3. Territory ownership and visualization

### 3. Statistics Tracking
1. Distance calculation
2. Calorie estimation (based on average user weight)
3. Running time tracking
4. Area captured tracking

### 4. Database Storage
1. User authentication with bcrypt password hashing
2. Running session history
3. Route coordinate storage
4. Territory polygon storage with ownership

### 5. Leaderboard System
1. Rank users by total territory area
2. Rank users by total running distance
3. User rank calculation

## Usage

### Starting a Run

1. Click "Start Running" on the home page
2. The app will request GPS permission
3. Map will center on current location
4. Run your route and complete a closed loop
5. Click "Finish" to end the session
6. If valid closed loop detected, territory is captured

### Viewing Territories

1. All territories are displayed on the map as colored polygons
2. Markers at center of each territory show owner username
3. Home page shows recent running sessions

### Checking Leaderboard

1. View top runners by territory area or distance
2. See your current rank based on criteria

## Technical Details

### Closed Loop Detection

A running route is considered a closed loop when:
1. The distance between the start point and end point is ≤ 50 meters
2. At least 2 coordinate points are recorded

### Area Calculation

1. Uses Turf.js for polygon area calculation
2. Polygon is created from running coordinates
3. Area stored in square meters

### Distance Calculation

1. Uses Haversine formula for geographic distance calculation
2. Accumulates distance between all consecutive coordinate points
3. Result stored in kilometers

### Calorie Estimation

1. Formula: `distance (km) × weight (kg) × 0.63`
2. Assumes average user weight of 70 kg
3. Adjusted based on running speed and terrain

## Integration Notes

This application integrates with existing login/signup pages. The pages are implemented using:
1. EJS templates for rendering
2. Client-side JWT token storage in localStorage
3. Token-based API authentication

Login and signup pages should:
1. Store JWT token in localStorage
2. Redirect authenticated users to home page
3. Handle token validation and refresh

## Future Enhancements

1. [ ] Territory conflict handling with automatic boundary adjustment
1. [ ] Google/Apple login integration
1. [ ] Real-time territory challenges
1. [ ] Social features (friends, competitions)
1. [ ] Advanced statistics and analytics
1. [ ] Mobile app development
1. [ ] Offline mode support
1. [ ] Territory trading/purchasing

## Troubleshooting

### Database Connection Issues

Check `.env` file settings and ensure MongoDB service is running.

### GPS Not Working

1. Check browser's location permission settings
2. Ensure HTTPS is used in production
3. Some browsers require user interaction to enable geolocation

### Map Not Displaying

1. Verify Leaflet.js and OpenStreetMap CDN links are loading
2. Check browser console for errors
3. Ensure map container has proper CSS styling

## Support

For issues or questions, please refer to the documentation or contact the development team.

## License

MIT
# TerritoryRunner
# TerritoryRunner
# TerritoryRunner
