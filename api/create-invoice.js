// api/create-invoice.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Secure price mapping - product names to Stripe price IDs
const priceMapping = {
  "The Tornado": "price_1RMDfxFXBh2FfiM2A2TLeZI2",
  "Sprikles": "price_1RMDf7FXBh2FfiM2ofCMBn4d",
  "wheel": "price_1RMDPsFXBh2FfiM2ezrEdtWP",
  "Ice Off": "price_1RMDOsFXBh2FfiM2umglwjbB",
  "Shift Line A & B": "price_1RMDHnFXBh2FfiM2Wjp32JAV",
  "Unfold": "price_1RMDH3FXBh2FfiM2OSyGZ6UD",
  "Projector": "price_1RMDFzFXBh2FfiM2Y9UfauFQ",
  "Pop up Pro": "price_1RMDFDFXBh2FfiM27vhVQqLT",
  "MeshGen": "price_1RMDDoFXBh2FfiM2QiIH4gcd",
  "Slideshow B": "price_1RMD9XFXBh2FfiM2gYkPOpTZ",
  "Slideshow A": "price_1RMD8rFXBh2FfiM27hhFvwjl",
  "The Sprayer": "price_1RMD7xFXBh2FfiM2vgiPHmdb",
  "swirls": "price_1RMD73FXBh2FfiM2FvTIh3si",
  "Cloth On Path": "price_1RMD3cFXBh2FfiM2Kddmsols",
  "Gear Platform": "price_1RMD2ZFXBh2FfiM2BgdWYm6Q",
  "Levitate": "price_1RMD1DFXBh2FfiM2uR1E2Avh",
  "Ripples": "price_1RMD05FXBh2FfiM2ZCNNGiHq",
  "Motion Domain": "price_1RMCuMFXBh2FfiM2afaW3bXj",
  "Knitting effect": "price_1RMCpbFXBh2FfiM2q0d5pbb2",
  "Cleverpoly All in One": "price_1RJX94FXBh2FfiM2aOyEnQbP",
  "Easy Grid asset": "price_1QWQliFXBh2FfiM2LexToGlc",
  "Roll on Path asset": "price_1QWM3pFXBh2FfiM27PT0ZhgT",
  "Pack of 5 Hand-made motions": "price_1QWM21FXBh2FfiM21X0aVwgO",
  "Soft balls Asset": "price_1QWM0ZFXBh2FfiM2LUfq2M1v",
  "Bubbles on Path asset": "price_1QWLzdFXBh2FfiM2WyBPFmZC",
  "Good Shapekeys Asset": "price_1QWLxdFXBh2FfiM2jJiY0sEe",
  "Animated Array asset": "price_1QWLveFXBh2FfiM2hXqvkHx3",
  "Motion Line asset": "price_1QWLrBFXBh2FfiM2XdHzF469",
  "Cloth Printing asset": "price_1QWLoBFXBh2FfiM2Jw1gEtIV",
  "360 Loop asset": "price_1Q8PJYFXBh2FfiM2ywcoxwVw",
  "Auto Animate - asset": "price_1Q8PItFXBh2FfiM2L3EinmLP",
  "Jump & Roll asset": "price_1Q8PBtFXBh2FfiM2OQ6PyJNF",
  "Scale & Slide motion Asset": "price_1Q8P7ZFXBh2FfiM2u6ZS3cHC",
  "Things on Path Asset": "price_1Q8P5BFXBh2FfiM2bgbmL9Ul",
  "Water on Path Asset": "price_1Q8P40FXBh2FfiM2EdzLBP6k",
  "The Lazy Motion Library Season 1": "price_1Q8OSqFXBh2FfiM2lQyF2cta",
  "Textify: Callouts & Titles animation": "price_1PmGneFXBh2FfiM2n4WQUuj4",
  "Advanced 3d Product Animation Course": "price_1PmGfEFXBh2FfiM23zNpC9pp",
  "H2O Droplet Simulation": "price_1PfilwFXBh2FfiM2Ce9p1FqB"
};

// Simple in-memory storage for demo (in production, use a database)
const tokenStorage = new Map();

export default async function handler(req, res) {
  // Enable CORS for your website
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { bundleData, verificationToken } = req.body;

    let finalBundleData;

    if (verificationToken) {
      // This is a verification request - look up the stored data
      finalBundleData = tokenStorage.get(verificationToken);
      
      if (!finalBundleData) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid or expired verification token' 
        });
      }

      // Delete the token after use (one-time use)
      tokenStorage.delete(verificationToken);
      
    } else if (bundleData) {
      // This is initial storage request from Make.com
      finalBundleData = bundleData;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'No bundle data or verification token provided' 
      });
    }

    // Validate bundle data
    if (!finalBundleData || !finalBundleData.customerEmail || !finalBundleData.selectedProducts) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid bundle data - missing email or products' 
      });
    }

    // Convert product names to price IDs
    const productsWithPriceIds = finalBundleData.selectedProducts.map(product => {
      const priceId = priceMapping[product.name];
      if (!priceId) {
        throw new Error(`Unknown product: ${product.name}`);
      }
      return {
        ...product,
        priceId: priceId
      };
    });

    // Server-side discount validation (prevents cheating!)
    const subtotal = productsWithPriceIds.reduce((sum, product) => sum + product.price, 0);
    const serverDiscountPercent = calculateDiscount(subtotal);

    console.log('Creating invoice for:', finalBundleData.customerEmail);
    console.log('Products:', productsWithPriceIds.length);
    console.log('Product names:', productsWithPriceIds.map(p => p.name));
    console.log('Subtotal:', subtotal);
    console.log('Discount:', serverDiscountPercent + '%');

    // Create Stripe invoice
    const invoice = await createStripeInvoice(
      finalBundleData.customerEmail,
      finalBundleData.customerName || 'Customer',
      productsWithPriceIds,
      serverDiscountPercent
    );

    console.log('Invoice created successfully:', invoice.id);

    return res.status(200).json({
      success: true,
      invoiceId: invoice.id,
      invoiceUrl: invoice.hosted_invoice_url,
      total: (invoice.total / 100).toFixed(2),
      discountPercent: serverDiscountPercent
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create invoice'
    });
  }
}

// Store bundle data and return token (called by Make.com)
export async function storeBundle(bundleData) {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  // Store with 1 hour expiration
  tokenStorage.set(token, {
    ...bundleData,
    expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
  });

  // Clean up expired tokens
  cleanupExpiredTokens();
  
  return token;
}

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of tokenStorage.entries()) {
    if (data.expiresAt && data.expiresAt < now) {
      tokenStorage.delete(token);
    }
  }
}

// Calculate discount (matches your frontend)
function calculateDiscount(totalPrice) {
  if (totalPrice >= 100) return Math.min(25, Math.floor((totalPrice - 100) / 10) + 15);
  if (totalPrice >= 50) return Math.min(15, Math.floor((totalPrice - 50) / 5) + 10);
  if (totalPrice >= 20) return Math.min(10, Math.floor((totalPrice - 20) / 3) + 5);
  if (totalPrice >= 13) return 5;  // Both products = $13
  return 0;
}

// Create Stripe invoice
async function createStripeInvoice(customerEmail, customerName, products, discountPercent) {
  try {
    console.log('Step 1: Creating/finding customer...');
    
    // Step 1: Create or get customer
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      console.log('Found existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName
      });
      console.log('Created new customer:', customer.id);
    }

    console.log('Step 2: Creating invoice...');
    
    // Step 2: Create invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 30,
      auto_advance: false
    });

    console.log('Invoice created:', invoice.id);
    console.log('Step 3: Adding products...');

    // Step 3: Add line items
    for (const product of products) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        price: product.priceId,
        quantity: 1
      });
      console.log('Added product:', product.name, '→', product.priceId);
    }

    // Step 4: Apply discount if applicable
    if (discountPercent > 0) {
      console.log('Step 4: Applying discount:', discountPercent + '%');
      
      const coupon = await stripe.coupons.create({
        percent_off: discountPercent,
        duration: 'once',
        name: `Bundle Discount ${discountPercent}%`,
        max_redemptions: 1
      });

      await stripe.invoices.update(invoice.id, {
        discounts: [{
          coupon: coupon.id
        }]
      });
      
      console.log('Discount applied successfully');
    }

    console.log('Step 5: Finalizing invoice...');
    
    // Step 5: Finalize invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    
    console.log('Invoice finalized successfully!');
    return finalizedInvoice;

  } catch (error) {
    console.error('Stripe operation failed:', error.message);
    throw new Error(`Stripe error: ${error.message}`);
  }
}
