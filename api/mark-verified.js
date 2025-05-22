// api/mark-verified.js
// Use global storage shared across all API endpoints
global.tokenStorage = global.tokenStorage || new Map();
global.verificationStorage = global.verificationStorage || new Map();

export default async function handler(req, res) {
  // Enhanced CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, email } = req.body;

    console.log('Marking verified for token:', token);
    console.log('Email:', email);

    // Get the bundle data from token storage
    const bundleData = global.tokenStorage.get(token);
    
    if (!bundleData) {
      console.log('Token not found or expired');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    console.log('Found bundle data for:', bundleData.customerEmail);

    // Mark as verified for this email
    global.verificationStorage.set(email, {
      verified: true,
      bundleData: bundleData,
      timestamp: Date.now()
    });

    // Clean up the token (one-time use)
    global.tokenStorage.delete(token);

    console.log('Marked as verified for email:', email);

    return res.status(200).json({
      success: true,
      message: 'Verification complete'
    });

  } catch (error) {
    console.error('Error marking verified:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark as verified'
    });
  }
}
