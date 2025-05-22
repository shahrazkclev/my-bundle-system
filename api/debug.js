// api/debug.js
// Simple endpoint to test if Vercel APIs are working

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🔍 Debug endpoint called');
  console.log('🔍 Method:', req.method);
  console.log('🔍 Headers:', req.headers);
  console.log('🔍 Query:', req.query);
  console.log('🔍 Body:', req.body);

  const debugInfo = {
    success: true,
    message: '🎉 Vercel API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      vercelRegion: process.env.VERCEL_REGION || 'unknown'
    }
  };

  console.log('✅ Debug response:', debugInfo);

  return res.status(200).json(debugInfo);
}
