import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { IoMdShare } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';

const ProductCard = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.user);

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      setIsLiked(!isLiked);
      // Add your like functionality here
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Add your share functionality here
  };

  return (
    <motion.div
      className="relative group w-full max-w-[280px] mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link to={`/product/${data._id}`}>
        <div className="relative overflow-hidden rounded-xl aspect-[3/4] bg-[#2A2A3C]">
          {/* Main Images */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isHovered ? 'mockup' : 'design'}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <img
                src={isHovered ? data.mockup_url : data.design_preview}
                className="w-full h-full object-cover"
                alt={data.name}
              />
            </motion.div>
          </AnimatePresence>

          {/* Overlay with Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
          >
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white font-medium"
              >
                ${data.price}
              </motion.span>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
                >
                  {isLiked ? (
                    <AiFillHeart className="text-red-500" size={20} />
                  ) : (
                    <AiOutlineHeart className="text-white" size={20} />
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
                >
                  <IoMdShare className="text-white" size={20} />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Sale Badge */}
          {data.discount_price && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              Sale!
            </motion.div>
          )}
        </div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-center"
        >
          <h3 className="text-white text-lg font-medium truncate">
            {data.name}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            by {data.shop.name}
          </p>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;