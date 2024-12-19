// components/Route/BestDeals/BestDeals.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../ProductCard/ProductCard";

const BestDeals = () => {
  const { allProducts, isLoading } = useSelector((state) => state.products);
  const [data, setData] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', name: 'All', icon: '☀️' },
    { id: 'trending', name: 'Trending', icon: '🔥' },
    { id: 'popular', name: 'Popular', icon: '👑' },
    { id: 'new', name: 'New Arrivals', icon: '✨' },
  ];

  useEffect(() => {
    if (allProducts) {
      let filteredProducts = [...allProducts].filter(item => item.status === 'public');

      switch (activeFilter) {
        case 'trending':
          filteredProducts = filteredProducts.sort((a, b) => b.sold_out - a.sold_out);
          break;
        case 'popular':
          filteredProducts = filteredProducts.sort((a, b) => b.rating - a.rating);
          break;
        case 'new':
          filteredProducts = filteredProducts.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
        default:
          filteredProducts = filteredProducts.sort((a, b) => b.sold_out - a.sold_out);
      }

      setData(filteredProducts.slice(0, 8));
    }
  }, [allProducts, activeFilter]);

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col space-y-8">
          {/* Header Section with Filter Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <h2 className="text-3xl font-bold text-gray-900">Best Sellers</h2>
              <p className="mt-2 text-gray-600">Discover our most popular designs</p>
            </motion.div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium 
                    transition-all duration-300 ${
                      activeFilter === filter.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {isLoading ? (
                // Skeleton Loading
                Array(8).fill(null).map((_, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-xl aspect-[3/4] animate-pulse"
                  />
                ))
              ) : data.length > 0 ? (
                data.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: index * 0.1 }
                    }}
                  >
                    <ProductCard data={product} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <span className="text-6xl mb-4">🔍</span>
                  <p className="text-gray-600 text-lg">No products found</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default BestDeals;