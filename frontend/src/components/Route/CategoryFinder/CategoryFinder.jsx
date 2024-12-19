import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../ProductCard/ProductCard';

const CategoryFinder = () => {
  const categories = [
    { 
      id: 'funny',
      name: 'Comedian',
      icon: '😄',
      description: 'For the ones who love to make others laugh'
    },
    { 
      id: 'music',
      name: 'Musical Soul',
      icon: '🎵',
      description: 'For music lovers and rhythm makers'
    },
    { 
      id: 'movies',
      name: 'Movie Buff',
      icon: '🎬',
      description: 'For cinema enthusiasts'
    },
    { 
      id: 'tv',
      name: 'Channel Surfer',
      icon: '📺',
      description: 'For TV show binge-watchers'
    },
    { 
      id: 'sports',
      name: 'Sports Fanatic',
      icon: '⚽',
      description: 'For the game lovers'
    },
    { 
      id: 'anime',
      name: 'Anime Lover',
      icon: '🎌',
      description: 'For manga and anime fans'
    },
    { 
      id: 'scifi',
      name: 'Sci-Fi Nerd',
      icon: '👽',
      description: 'For future tech enthusiasts'
    },
    { 
      id: 'vintage',
      name: 'Vintage',
      icon: '📻',
      description: 'For retro style lovers'
    }
  ];

  const [selectedCategory, setSelectedCategory] = useState('');
  const { allProducts } = useSelector((state) => state.products);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    if (selectedCategory && allProducts) {
      const filtered = allProducts.filter(product => 
        product.category === selectedCategory && product.status === 'public'
      );
      setFilteredProducts(filtered.slice(0, 8)); 
    }
  }, [selectedCategory, allProducts]);

  return (
    <section className="bg-[#151523] text-white py-12">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Find Your Perfect Style Match
          </h1>
          <p className="text-lg text-gray-300">
            Choose your vibe and discover designs made just for you
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-12">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`relative group p-4 rounded-xl transition-all duration-300
                ${selectedCategory === category.id 
                  ? 'bg-[#2A2A3C] border-2 border-[#6366F1]' 
                  : 'bg-[#1F1F2E] hover:bg-[#2A2A3C] border-2 border-transparent'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                <span className="text-sm font-medium whitespace-nowrap">
                  {category.name}
                </span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300
                bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-sm
                bg-black text-white rounded pointer-events-none whitespace-nowrap z-10">
                {category.description}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Products Grid */}
        {selectedCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard data={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View All Button */}
        {selectedCategory && filteredProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <Link 
              to={`/products?category=${selectedCategory}`}
              className="inline-block bg-[#6366F1] hover:bg-[#5558E8] text-white px-8 py-3 rounded-lg 
                font-medium transition-colors"
            >
              View All Designs
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CategoryFinder;