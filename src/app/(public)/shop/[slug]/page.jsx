import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/shop/ProductDetailClient';
import ProductJsonLd from '@/components/seo/ProductJsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

// Server-side function to fetch product data
async function getProduct(slug) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products/${slug}`, {
      cache: 'no-store' // Ensure fresh data for meta tags
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Generate metadata for Open Graph sharing
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    };
  }

  const productImage = product.images?.[0] || product.thumbnail || `${SITE_URL}/logos/angeles-roadsters.png`;
  const price = product.discountedPrice || product.price;
  const discount = product.discountedPrice && product.price > product.discountedPrice
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0;

  return {
    title: `${product.name} - ${SITE_NAME}`,
    description: product.description || `${product.name} - Premium riding gear and accessories from ${SITE_NAME}`,
    keywords: [product.name, product.brand, product.category?.name, 'riding gear', 'motorcycle accessories'].filter(Boolean),
    openGraph: {
      title: `${product.name} - ${SITE_NAME}`,
      description: product.description || `${product.name} - Premium riding gear and accessories`,
      type: 'product',
      url: `${SITE_URL}/shop/${product.slug}`,
      siteName: SITE_NAME,
      images: [
        {
          url: productImage,
          width: 1200,
          height: 630,
          alt: product.name,
          type: 'image/jpeg'
        }
      ],
      locale: 'en_IN'
    },
    twitter: {
      card: 'summary_large_image',
      site: '@angels_roadsters',
      creator: '@angels_roadsters',
      title: `${product.name} - ${SITE_NAME}`,
      description: product.description || `${product.name} - Premium riding gear and accessories`,
      images: [productImage]
    },
    // Structured data for products
    other: {
      'product:price:amount': price,
      'product:price:currency': 'INR',
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
      'product:brand': product.brand || SITE_NAME,
      'product:category': product.category?.name || 'Riding Gear'
    }
  };
}

export default async function ProductDetailPage({ params }) {
  const product = await getProduct(params.slug);
  
  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductJsonLd product={product} />
      <ProductDetailClient product={product} />
    </>
  );
}
