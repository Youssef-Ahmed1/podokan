// components/Categories/Categories.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Navigation, Pagination } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Categories = ({ categories }) => {
  return (
    <div className="relative py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Categories</h2>
        </div>
        
        {/* Swiper Container */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={16}
            slidesPerView="auto"
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            breakpoints={{
              320: { slidesPerView: 2.2 },
              480: { slidesPerView: 3.2 },
              768: { slidesPerView: 4.2 },
              1024: { slidesPerView: 5.2 },
            }}
            className="!pt-2 !pb-8" // Padding for navigation arrows
          >
            {categories.map((category) => (
              <SwiperSlide key={category._id} className="!w-auto">
                <CategoryCard category={category} />
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Custom Navigation Buttons */}
          <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="swiper-button-prev-custom w-8 h-8 rounded-full bg-white shadow-md
                flex items-center justify-center cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          </div>
          
          <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="swiper-button-next-custom w-8 h-8 rounded-full bg-white shadow-md
                flex items-center justify-center cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryCard = ({ category }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="relative group"
  >
    <div className="rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md
      transition-all duration-300 p-3"
    >
      <img
        src={category.image}
        alt={category.name}
        className="w-16 h-16 object-cover rounded-lg mx-auto mb-2"
      />
      <h3 className="text-center text-sm font-medium truncate">
        {category.name}
      </h3>
    </div>
  </motion.div>
);

export default Categories;