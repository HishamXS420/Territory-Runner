const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserStatistics = require('../models/UserStatistics');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log('📝 Registration attempt:', { username, email });

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('⚠️ Email already in use:', email);
      return res.status(409).json({ message: 'Email already in use.' });
    }

    // Create user
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase(),
      password: password,
    });

    const user = await newUser.save();
    console.log('✅ User registered successfully:', user._id);

    // Create user statistics entry
    const stats = new UserStatistics({
      userId: user._id,
      totalDistance: 0,
      totalTime: 0,
      totalCalories: 0,
      totalTerritoryArea: 0,
      totalRunningSessions: 0,
    });
    await stats.save();
    console.log('✅ User statistics created:', stats._id);

    res.status(201).json({ 
      message: 'User registered successfully.', 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Login attempt:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user with password field selected
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Verify password using Mongoose method
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    console.log('✅ Login successful:', user._id);

    res.json({ 
      message: 'Login successful.', 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('👤 Fetching profile for user:', userId);

    const user = await User.findById(userId);
    const stats = await UserStatistics.findOne({ userId: userId });

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ message: 'User not found.' });
    }

    console.log('✅ User profile fetched successfully');

    res.json({ 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        createdAt: user.createdAt 
      }, 
      stats 
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
