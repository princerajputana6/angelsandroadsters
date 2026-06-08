// Server-side layout for /shop/[slug] — generates per-product metadata so
// pasting a product link in WhatsApp / Slack / X / FB shows the product image
// + name + description instead of the generic site brand.

import { mergeKeywords, SITE_NAME, SITE_URL } from '@/lib/seo';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';

async function getProduct(slug) {
  try {
    await connectDB();
    return await Product.findOne({ slug, isActive: true })
      .populate('category', 'name parent')
      .lean();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: 'Product',
      keywords: mergeKeywords([]),
    };
  }

  const title = product.name;
  const priceLine =
    product.discountedPrice && product.discountedPrice < product.price
      ? `₹${product.discountedPrice.toLocaleString()} (was ₹${product.price.toLocaleString()})`
      : `₹${product.price.toLocaleString()}`;

  // First 200 chars of description plus the price — gives previews real signal.
  const baseDesc = (product.description || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  const description = baseDesc
    ? `${baseDesc} · ${priceLine}`
    : `${product.name} · ${priceLine} · ${SITE_NAME}`;

  const image = product.thumbnail || product.images?.[0];
  const url = `${SITE_URL}/shop/${product.slug}`;

  return {
    title,
    description,
    keywords: mergeKeywords([
      product.name,
      product.brand,
      product.category?.name,
      product.category?.parent,
      ...(product.tags || []),
      'buy online India',
    ].filter(Boolean)),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',                            // product type isn't in next/metadata's enum
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: 'en_IN',
      images: image ? [{ url: image, alt: product.name, width: 1200, height: 1200 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
    // Product-specific structured data hint via other meta tags
    other: {
      'product:price:amount': String(product.discountedPrice || product.price || ''),
      'product:price:currency': 'INR',
      ...(product.brand ? { 'product:brand': product.brand } : {}),
      ...(typeof product.stock === 'number'
        ? { 'product:availability': product.stock > 0 ? 'in stock' : 'out of stock' }
        : {}),
    },
  };
}

export default function ProductSlugLayout({ children }) {
  return children;
}
