// api/mark-verified.js
// Test version to verify email verification flow

// Access global storage
global.tokenStorage = global.tokenStorage || new Map();
global.verificationStorage = global.verificationStorage || new Map();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log everything
  console.log('🔍 mark-verified called');
  console.log('🔍 Method:', req.method);
  console.log('🔍 Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      received: req.method 
    });
  }

  try {
    const { token, email } = req.body;

    console.log('🎫 Received token:', token);
    console.log('📧 Received email:', email);

    // Validate inputs
    if (!token || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing token or email',
        received: { token: !!token, email: !!email }
      });
    }

    // Check if token exists in storage
    const bundleData = global.tokenStorage.get(token);
    
    if (!bundleData) {
      console.log('❌ Token not found in storage');
      console.log('🔍 Available tokens:', Array.from(global.tokenStorage.keys()));
      
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired token',
        tokenProvided: token,
        availableTokens: Array.from(global.tokenStorage.keys()).length
      });
    }

    console.log('✅ Found bundle data for token');
    console.log('👤 Bundle customer:', bundleData.customerEmail);
    console.log('📧 Verification email:', email);

    // Check if emails match
    if (bundleData.customerEmail !== email) {
      console.log('❌ Email mismatch');
      return res.status(400).json({ 
        success: false, 
        error: 'Email does not match bundle data',
        bundleEmail: bundleData.customerEmail,
        verificationEmail: email
      });
    }

    // Mark as verified
    global.verificationStorage.set(email, {
      verified: true,
      bundleData: bundleData,
      verifiedAt: new Date().toISOString(),
      timestamp: Date.now()
    });

    // Clean up token (one-time use)
    global.tokenStorage.delete(token);

    console.log('✅ Successfully marked as verified');
    console.log('📊 Verification storage size:', global.verificationStorage.size);

    return res.status(200).json({
      success: true,
      message: 'Email verification successful',
      debug: {
        email: email,
        verifiedAt: new Date().toISOString(),
        verificationStorageSize: global.verificationStorage.size,
        tokenStorageSize: global.tokenStorage.size
      }
    });

  } catch (error) {
    console.error('❌ Error in mark-verified:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
