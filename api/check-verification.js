// api/check-verification.js
// Simple in-memory storage
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
    const { email } = req.body;

    const verification = verificationStorage.get(email);
    
    if (verification && verification.verified) {
      // Clean up after returning the data
      verificationStorage.delete(email);
      
      return res.status(200).json({
        verified: true,
        bundleData: verification.bundleData
      });
    }

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
