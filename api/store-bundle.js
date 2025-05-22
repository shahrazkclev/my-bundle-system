// api/store-bundle.js
global.tokenStorage = global.tokenStorage || new Map();

// CORS helper function
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

export default async function handler(req, res) {
  // Set CORS headers for all responses
  setCorsHeaders(res);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Log everything for debugging
  console.log('🔍 store-bundle called');
  console.log('🔍 Method:', req.method);
  console.log('🔍 Headers:', req.headers);
  console.log('🔍 Body type:', typeof req.body);
  console.log('🔍 Body content:', req.body);

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

    // Validate data
    if (!bundleData || typeof bundleData !== 'object') {
      console.log('❌ Invalid data type:', typeof bundleData);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid data format',
        receivedType: typeof bundleData,
        receivedValue: bundleData
      });
    }

    if (!bundleData.customerEmail) {
      console.log('❌ Missing customerEmail');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing customerEmail',
        receivedFields: Object.keys(bundleData || {})
      });
    }

    if (!bundleData.selectedProducts || !Array.isArray(bundleData.selectedProducts)) {
      console.log('❌ Missing or invalid selectedProducts');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid selectedProducts',
        receivedProducts: bundleData.selectedProducts
      });
    }

    if (bundleData.selectedProducts.length === 0) {
      console.log('❌ No products selected');
      return res.status(400).json({ 
        success: false, 
        error: 'No products selected',
        productsCount: 0
      });
    }

    // Generate unique token
    const token = 'bundle_' + Math.random().toString(36).substring(2) + '_' + Date.now();
    
    // Store data with expiration
    const storedData = {
      ...bundleData,
      token: token,
      storedAt: new Date().toISOString(),
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
    };

    global.tokenStorage.set(token, storedData);

    // Cleanup expired tokens
    cleanupExpiredTokens();

    // Log success
    console.log('✅ Successfully stored bundle data');
    console.log('🎫 Token:', token);
    console.log('👤 Customer:', bundleData.customerEmail);
    console.log('🛒 Products:', bundleData.selectedProducts.map(p => p.name).join(', '));
    console.log('💰 Total:', bundleData.bundleSummary?.total || 'Unknown');
    console.log('📊 Storage size:', global.tokenStorage.size);

    // Return success
    return res.status(200).json({
      success: true,
      token: token,
      message: 'Bundle data stored successfully',
      debug: {
        customerEmail: bundleData.customerEmail,
        customerName: bundleData.customerName,
        productsCount: bundleData.selectedProducts.length,
        productNames: bundleData.selectedProducts.map(p => p.name),
        subtotal: bundleData.bundleSummary?.subtotal,
        total: bundleData.bundleSummary?.total,
        discountPercent: bundleData.bundleSummary?.discountPercent,
        storedAt: storedData.storedAt,
        storageSize: global.tokenStorage.size,
        tokenPrefix: token.substring(0, 15) + '...'
      }
    });

  } catch (error) {
    console.error('❌ Error in store-bundle:', error);
    console.error('❌ Stack trace:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : 'Contact support'
    });
  }
}

function cleanupExpiredTokens() {
  const now = Date.now();
  let cleaned = 0;
  for (const [token, data] of global.tokenStorage.entries()) {
    if (data.expiresAt && data.expiresAt < now) {
      global.tokenStorage.delete(token);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired tokens`);
  }
}
