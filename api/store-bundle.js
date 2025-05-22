// api/store-bundle.js
// Global storage that all API endpoints can access
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
    const { bundleData } = req.body;

    if (!bundleData || !bundleData.customerEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid bundle data' 
      });
    }

    // Generate unique token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Store with 1 hour expiration
    global.tokenStorage.set(token, {
      ...bundleData,
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
    });

    console.log('Stored bundle data with token:', token);
    console.log('Customer:', bundleData.customerEmail);

    // Clean up expired tokens
    cleanupExpiredTokens();

    return res.status(200).json({
      success: true,
      token: token
    });

  } catch (error) {
    console.error('Error storing bundle:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to store bundle data'
    });
  }
}

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of global.tokenStorage.entries()) {
    if (data.expiresAt && data.expiresAt < now) {
      global.tokenStorage.delete(token);
    }
  }
}
