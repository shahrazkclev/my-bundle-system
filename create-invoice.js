const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { bundleData } = req.body;

    if (!bundleData || !bundleData.customerEmail) {
      return res.status(400).json({ success: false, error: 'Missing data' });
    }

    const subtotal = bundleData.selectedProducts.reduce((sum, product) => sum + product.price, 0);
    const discountPercent = subtotal >= 13 ? 5 : 0;

    const customers = await stripe.customers.list({ email: bundleData.customerEmail, limit: 1 });
    
    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: bundleData.customerEmail,
        name: bundleData.customerName || 'Customer'
      });
    }

    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 30
    });

    for (const product of bundleData.selectedProducts) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        price: product.priceId,
        quantity: 1
      });
    }

    if (discountPercent > 0) {
      const coupon = await stripe.coupons.create({
        percent_off: discountPercent,
        duration: 'once',
        name: `Bundle Discount ${discountPercent}%`
      });

      await stripe.invoices.update(invoice.id, {
        discounts: [{ coupon: coupon.id }]
      });
    }

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    return res.status(200).json({
      success: true,
      invoiceId: finalizedInvoice.id,
      invoiceUrl: finalizedInvoice.hosted_invoice_url
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}