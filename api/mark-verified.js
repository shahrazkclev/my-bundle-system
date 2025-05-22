// api/mark-verified.js
// Simple in-memory storage
const tokenStorage = new Map();
const verificationStorage = new Map(); // email -> verification status

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, email } = req.body;

    // Get the bundle data from token storage
    const bundleData = tokenStorage.get(token);
    
    if (!bundleData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Mark as verified for this email
    verificationStorage.set(email, {
      verified: true,
      bundleData: bundleData,
      timestamp: Date.now()
    });

    // Clean up the token (one-time use)
    tokenStorage.delete(token);

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
