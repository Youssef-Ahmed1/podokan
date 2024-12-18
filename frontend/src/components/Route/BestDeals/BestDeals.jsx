import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from "../../../styles/styles";
import ProductCard from "../ProductCard/ProductCard";
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Navigation, Pagination, Autoplay } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Initialize Swiper modules
SwiperCore.use([Navigation, Pagination, Autoplay]);

const BestDeals = () => {
  const [data, setData] = useState([]);
  const { allProducts, isLoading } = useSelector((state) => state.products);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isVisible, setIsVisible] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: '🌟', color: '#6366F1' },
    { id: 'trending', name: 'Trending', icon: '🔥', color: '#EF4444' },
    { id: 'popular', name: 'Popular', icon: '👑', color: '#F59E0B' },
    { id: 'new', name: 'New Arrivals', icon: '✨', color: '#10B981' },
  ];

  useEffect(() => {
    setIsVisible(true);
    const filterProducts = () => {
      const allProductsData = allProducts ? [...allProducts] : [];
      let filteredData;
      
      if (activeCategory === 'all') {
        filteredData = allProductsData;
      } else {
        filteredData = allProductsData.filter(item => 
          item.category === activeCategory && item.status === 'public'
        );
      }
      
      const sortedData = filteredData?.sort((a,b) => b.sold_out - a.sold_out);
      const firstEight = sortedData && sortedData.slice(0, 8);
      setData(firstEight);
    };

    filterProducts();
  }, [allProducts, activeCategory]);

  return (
    <div className="bg-[#1E1E2D] py-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${styles.section}`}
      >
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col md:flex-row justify-between items-center"
          >
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-0"
            >
              Best Sellers
            </motion.h1>
            
            {/* Category Navigation */}
            <div className="w-full md:w-auto">
              <Swiper
                spaceBetween={10}
                slidesPerView="auto"
                navigation
                pagination={{ clickable: true }}
                className="category-swiper"
              >
                {categories.map((category, index) => (
                  <SwiperSlide key={category.id}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium 
                        transition-all duration-300 ${
                          activeCategory === category.id
                            ? `bg-${category.color} text-white shadow-lg`
                            : 'bg-[#2A2A3C] text-gray-300 hover:bg-[#3D3D56]'
                        }`}
                      style={{
                        background: activeCategory === category.id ? category.color : undefined
                      }}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span>{category.name}</span>
                    </motion.button>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </motion.div>

          {/* Products Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center"
            >
              {isLoading ? (
                Array(8).fill(0).map((_, index) => (
                  <div key={index} className="w-full max-w-[280px]">
                    <Skeleton 
                      height={350} 
                      baseColor="#2A2A3C" 
                      highlightColor="#3D3D56"
                      className="rounded-xl"
                    />
                  </div>
                ))
              ) : data && data.length > 0 ? (
                data.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard data={product} />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-6xl mb-4"
                  >
                    🔍
                  </motion.div>
                  <p className="text-gray-400 text-lg">No products found in this category</p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default BestDeals;
