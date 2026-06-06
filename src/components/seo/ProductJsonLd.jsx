import { SITE_NAME, SITE_URL } from '@/lib/seo';

export default function ProductJsonLd({ product }) {
  const price = product.discountedPrice || product.price;
  const productImage = product.images?.[0] || product.thumbnail || `${SITE_URL}/logos/angeles-roadsters.png`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: productImage,
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_NAME
    },
    category: product.category?.name || 'Riding Gear',
    sku: product._id,
    mpn: product._id,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/shop/${product.slug}`,
      priceCurrency: 'INR',
      price: price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL
      }
    }
  };

  // Add aggregateRating if reviews exist
  if (product.ratings?.count > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratings.average,
      reviewCount: product.ratings.count,
      bestRating: 5,
      worstRating: 1
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}