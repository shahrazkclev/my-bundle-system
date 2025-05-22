// api/check-verification.js
// Test version to verify polling works

// Access global storage
global.verificationStorage = global.verificationStorage || new Map();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log the check
  console.log('🔍 check-verification called');
  console.log('🔍 Method:', req.method);
  console.log('🔍 Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      received: req.method 
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        verified: false, 
        error: 'Email is required' 
      });
    }

    console.log('📧 Checking verification for:', email);
    console.log('📊 Current verification storage size:', global.verificationStorage.size);
    console.log('🔍 Available emails:', Array.from(global.verificationStorage.keys()));

    const verification = global.verificationStorage.get(email);
    
    if (verification && verification.verified) {
      console.log('✅ Verification found for email:', email);
      console.log('📦 Bundle data available:', !!verification.bundleData);
      
      // Return the data but keep it in storage for now (for debugging)
      return res.status(200).json({
        verified: true,
        bundleData: verification.bundleData,
        debug: {
          verifiedAt: verification.verifiedAt,
          hasCustomerEmail: !!verification.bundleData?.customerEmail,
          hasProducts: !!verification.bundleData?.selectedProducts,
          productsCount: verification.bundleData?.selectedProducts?.length || 0
        }
      });
    }

    console.log('⏳ No verification found yet for:', email);

    return res.status(200).json({
      verified: false,
      debug: {
        email: email,
        checkedAt: new Date().toISOString(),
        availableEmails: Array.from(global.verificationStorage.keys()),
        storageSize: global.verificationStorage.size
      }
    });

  } catch (error) {
    console.error('❌ Error checking verification:', error);
    
    return res.status(500).json({
      verified: false,
      error: 'Server error: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
