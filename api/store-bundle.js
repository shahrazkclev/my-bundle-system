// api/store-bundle.js
// Simple test version to verify data reception

// Global storage that persists across requests
global.tokenStorage = global.tokenStorage || new Map();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log everything for debugging
  console.log('🔍 Request method:', req.method);
  console.log('🔍 Request headers:', req.headers);
  console.log('🔍 Request body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      received: req.method 
    });
  }

  try {
    const bundleData = req.body;

    // Log received data
    console.log('📦 Received bundle data:', JSON.stringify(bundleData, null, 2));

    // Basic validation
    if (!bundleData) {
      return res.status(400).json({ 
        success: false, 
        error: 'No data received',
        receivedType: typeof bundleData
      });
    }

    if (!bundleData.customerEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing customerEmail',
        receivedFields: Object.keys(bundleData)
      });
    }

    if (!bundleData.selectedProducts || !Array.isArray(bundleData.selectedProducts)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid selectedProducts',
        receivedProducts: bundleData.selectedProducts
      });
    }

    // Generate token
    const token = 'test_' + Math.random().toString(36).substring(2) + '_' + Date.now();
    
    // Store data
    const storedData = {
      ...bundleData,
      token: token,
      storedAt: new Date().toISOString(),
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
    };

    global.tokenStorage.set(token, storedData);

    // Log success
    console.log('✅ Successfully stored data with token:', token);
    console.log('📊 Current storage size:', global.tokenStorage.size);
    console.log('👤 Customer:', bundleData.customerEmail);
    console.log('🛒 Products count:', bundleData.selectedProducts.length);

    // Return success with debug info
    return res.status(200).json({
      success: true,
      token: token,
      message: 'Bundle data stored successfully',
      debug: {
        customerEmail: bundleData.customerEmail,
        productsCount: bundleData.selectedProducts.length,
        storedAt: storedData.storedAt,
        storageSize: global.tokenStorage.size
      }
    });

  } catch (error) {
    console.error('❌ Error processing request:', error);
    console.error('❌ Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
