import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from "../../../styles/styles";
import ProductCard from "../ProductCard/ProductCard";

const BestDeals = () => {
  const [data, setData] = useState([]);
  const { allProducts } = useSelector((state) => state.products);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const allProductsData = allProducts ? [...allProducts] : [];
    const sortedData = allProductsData?.sort((a,b) => b.sold_out - a.sold_out); 
    const firstFive = sortedData && sortedData.slice(0, 5);
    setData(firstFive);
  }, [allProducts]);

  return (
    <div className={`${styles.section}`}>
      <div className="flex flex-col gap-8">
        {/* Section Header */}
        <div className={`${styles.heading}`}>
          <h1>Best Sellers</h1>
        </div>
        
        {/* Category Navigation */}
        <div className="scrollbar-hide overflow-x-auto">
          <div className="flex gap-4 pb-4 min-w-max px-4 md:px-0">
            {['all', 't-shirts', 'hoodies', 'sweatshirts'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`relative px-6 py-2 rounded-full text-[16px] font-[500] font-Roboto transition-all
                  ${activeCategory === category 
                    ? 'text-[#333] bg-gray-100' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
                {activeCategory === category && (
                  <span className={styles.active_indicator}></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data && data.length > 0 ? (
            data.map((product, index) => (
              <ProductCard key={product._id} data={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 font-Roboto">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default BestDeals;
