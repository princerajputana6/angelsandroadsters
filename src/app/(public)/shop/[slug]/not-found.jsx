import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="pt-24 sm:pt-28 pb-16">
      <div className="container-x">
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <svg
                className="mx-auto h-24 w-24 text-charcoal-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-charcoal-800 mb-4">Product Not Found</h1>
            <p className="text-charcoal-600 mb-8">
              The product you're looking for doesn't exist or may have been removed.
            </p>
            <div className="space-y-4">
              <Link
                href="/shop"
                className="inline-block bg-terra-400 text-white px-6 py-3 rounded-xl font-medium hover:bg-terra-500 transition"
              >
                Browse All Products
              </Link>
              <div className="text-sm">
                <Link href="/" className="text-terra-400 hover:text-terra-500">
                  Return to Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}