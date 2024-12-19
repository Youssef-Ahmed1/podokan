// components/Categories/Categories.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';

const Categories = () => {
  const categories = [
    { id: 'comedian', name: 'Comedian', icon: '😄' },
    { id: 'musical', name: 'Musical Soul', icon: '🎵' },
    { id: 'movie', name: 'Movie Buff', icon: '🎬' },
    { id: 'channel', name: 'Channel Surfer', icon: '📺' },
    { id: 'sports', name: 'Sports Fanatic', icon: '⚽' },
    { id: 'anime', name: 'Anime Lover', icon: '🎮' },
    { id: 'scifi', name: 'Sci-Fi Nerd', icon: '👽' },
    { id: 'vintage', name: 'Vintage', icon: '📷' },
  ];

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Find Your Perfect Style Match</h2>
          <p className="mt-2 text-gray-600">Choose your vibe and discover designs made just for you</p>
        </div>

        <Swiper
          modules={[Navigation]}
          spaceBetween={16}
          slidesPerView="auto"
          navigation
          className="categories-swiper !pt-4"
          breakpoints={{
            320: { slidesPerView: 2.2 },
            480: { slidesPerView: 3.2 },
            768: { slidesPerView: 4.2 },
            1024: { slidesPerView: 8 },
          }}
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id} className="!w-auto">
              <Link to={`/products?category=${category.id}`}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center gap-3"
                >
                  <span className="text-3xl">{category.icon}</span>
                  <span className="text-sm font-medium text-gray-800">{category.name}</span>
                </motion.div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default Categories;