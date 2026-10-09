const User = require('../models/User');

// Helper to check or seed initial admin user if environment variables are explicitly set
const initDefaultAdmin = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0 && process.env.DEFAULT_ADMIN_USERNAME && process.env.DEFAULT_ADMIN_PASSWORD) {
      console.log('🔄 Initializing admin user from environment configuration...');
      await User.create({
        username: process.env.DEFAULT_ADMIN_USERNAME,
        password: process.env.DEFAULT_ADMIN_PASSWORD,
      });
      console.log('✅ Admin user initialized successfully.');
    }
  } catch (err) {
    console.error('⚠️ Error checking initial admin user:', err.message);
  }
};

// @desc    Admin / User Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'कृपया युझरनेम आणि पासवर्ड प्रविष्ट करा (Please enter username & password)',
      });
    }

    const trimmedUsername = String(username).trim();

    // Find user in database
    const user = await User.findOne({ username: trimmedUsername });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'चुकीचा युझरनेम किंवा पासवर्ड! पुन्हा प्रयत्न करा. (Invalid credentials)',
      });
    }

    // Verify hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'चुकीचा युझरनेम किंवा पासवर्ड! पुन्हा प्रयत्न करा. (Invalid credentials)',
      });
    }

    res.status(200).json({
      success: true,
      message: 'लॉगइन यशस्वी झाले!',
      data: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({
      success: false,
      message: 'लॉगइन करताना सर्व्हर त्रुटी आली',
      error: err.message,
    });
  }
};

// @desc    Update Admin Credentials (Username and/or Password)
// @route   PUT /api/auth/update-credentials
// @access  Protected
const updateCredentials = async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'बदल करण्यासाठी चालू पासवर्ड आवश्यक आहे! (Current password required)',
      });
    }

    // Get the admin user record (first user or matched by username)
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'युझर खाते सापडले नाही (User not found)',
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'चालू पासवर्ड चुकीचा आहे! कृपया योग्य पासवर्ड टाका.',
      });
    }

    // Validate new username if provided
    if (newUsername && newUsername.trim()) {
      const trimmedName = newUsername.trim();
      if (trimmedName.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'नवीन युझरनेम कमीत कमी ३ अक्षरांचे असणे आवश्यक आहे',
        });
      }
      user.username = trimmedName;
    }

    // Validate new password if provided
    if (newPassword && newPassword.trim()) {
      const trimmedPass = newPassword.trim();
      if (trimmedPass.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'नवीन पासवर्ड कमीत कमी ४ अक्षरांचा असणे आवश्यक आहे',
        });
      }
      user.password = trimmedPass; // Will be hashed in pre-save hook
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'युझरनेम आणि पासवर्ड यशस्वीरित्या अपडेट झाले!',
      data: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Error updating credentials:', err);
    res.status(500).json({
      success: false,
      message: 'माहिती अपडेट करताना सर्व्हर त्रुटी आली',
      error: err.message,
    });
  }
};

// @desc    Get Current Logged in User Profile
// @route   GET /api/auth/me
// @access  Public
const getMe = async (req, res) => {
  try {
    const user = await User.findOne().select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'युझर सापडला नाही' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  initDefaultAdmin,
  login,
  updateCredentials,
  getMe,
};
