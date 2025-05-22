// api/check-verification.js
// Use global storage shared across all API endpoints
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
    const { email } = req.body;

    console.log('Checking verification for email:', email);

    const verification = global.verificationStorage.get(email);
    
    if (verification && verification.verified) {
      console.log('Verification found! Bundle data:', verification.bundleData.customerEmail);
      
      // Clean up after returning the data
      global.verificationStorage.delete(email);
      
      return res.status(200).json({
        verified: true,
        bundleData: verification.bundleData
      });
    }

    console.log('No verification found yet');

    return res.status(200).json({
      verified: false
    });

  } catch (error) {
    console.error('Error checking verification:', error);
    return res.status(500).json({
      verified: false,
      error: 'Failed to check verification'
    });
  }
}
