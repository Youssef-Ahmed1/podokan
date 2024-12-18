import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from "../../styles/styles";
import ProductCard from "../Route/ProductCard/ProductCard";

const SuggestedProduct = ({ data }) => {
  const { allProducts } = useSelector((state) => state.products);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (data && allProducts) {
      // Get products in the same category
      const sameCategory = allProducts.filter(
        (i) => i.category === data.category && i._id !== data._id && i.status === 'public'
      );

      // Get products from same shop
      const sameShop = allProducts.filter(
        (i) => i.shopId === data.shopId && i._id !== data._id && i.status === 'public'
      );

      // Combine and deduplicate
      const combined = [...new Set([...sameCategory, ...sameShop])];
      
      // Sort by relevance (you can modify this based on your needs)
      const sorted = combined.sort((a, b) => {
        // Prioritize items with similar tags
        const aCommonTags = a.tags?.filter(tag => data.tags?.includes(tag)).length || 0;
        const bCommonTags = b.tags?.filter(tag => data.tags?.includes(tag)).length || 0;
        
        if (bCommonTags !== aCommonTags) {
          return bCommonTags - aCommonTags;
        }
        
        // Then by rating
        return (b.ratings || 0) - (a.ratings || 0);
      });

      // Take top 5 items
      setRelatedProducts(sorted.slice(0, 5));
      setIsLoading(false);
    }
  }, [data, allProducts]);

  if (!data || relatedProducts.length === 0) return null;

  return (
    <div className="bg-white py-12">
      <div className={`${styles.section}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              You May Also Like
            </h2>
            {/* Optional: Add a "View All" button here */}
          </div>

          <div className="relative">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(5)].map((_, index) => (
                  <div 
                    key={index}
                    className="animate-pulse bg-gray-200 rounded-lg aspect-square"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {relatedProducts.map((product, index) => (
                  <div
                    key={product._id}
                    className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <ProductCard data={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestedProduct;