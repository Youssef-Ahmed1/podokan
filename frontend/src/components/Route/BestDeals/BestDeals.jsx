import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from "../../../styles/styles";
import ProductCard from "../ProductCard/ProductCard";
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// Import required modules directly from swiper
import SwiperCore, { Navigation, Pagination, Autoplay } from 'swiper';
import { categoriesData } from "../../../static/data";
import { motion } from "framer-motion";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Initialize Swiper modules
SwiperCore.use([Navigation, Pagination, Autoplay]);

const BestDeals = () => {
  const [data, setData] = useState([]);
  const { allProducts, isLoading } = useSelector((state) => state.products);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const filterProducts = () => {
      const allProductsData = allProducts ? [...allProducts] : [];
      const filteredData = activeCategory === 'all' 
        ? allProductsData 
        : allProductsData.filter(item => item.category === activeCategory);
      
      const sortedData = filteredData?.sort((a,b) => b.sold_out - a.sold_out);
      const firstEight = sortedData && sortedData.slice(0, 8);
      setData(firstEight);
    };

    filterProducts();
  }, [allProducts, activeCategory]);

  return (
    <div className="bg-[#1E1E2D] py-10">
      <div className={`${styles.section}`}>
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
                <SwiperSlide>
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all
                      ${activeCategory === 'all' 
                        ? 'bg-[#6366F1] text-white' 
                        : 'bg-[#2A2A3C] text-gray-300 hover:bg-[#3D3D56]'
                      }`}
                  >
                    All
                  </button>
                </SwiperSlide>
                {categoriesData.map((category) => (
                  <SwiperSlide key={category.id}>
                    <button
                      onClick={() => setActiveCategory(category.title)}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all
                        ${activeCategory === category.title 
                          ? 'bg-[#6366F1] text-white' 
                          : 'bg-[#2A2A3C] text-gray-300 hover:bg-[#3D3D56]'
                        }`}
                    >
                      {category.title}
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array(8).fill(0).map((_, index) => (
                <div key={index} className="bg-[#2A2A3C] rounded-xl p-4">
                  <Skeleton height={200} baseColor="#3D3D56" highlightColor="#4A4A6A"/>
                  <div className="mt-4">
                    <Skeleton count={2} baseColor="#3D3D56" highlightColor="#4A4A6A"/>
                  </div>
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
              <div className="col-span-full text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-400">No products found in this category</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestDeals;