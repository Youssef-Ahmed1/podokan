import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineHeart, AiFillHeart, AiOutlineShoppingCart } from 'react-icons/ai';
import { IoMdShare } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../../../redux/actions/wishlist';
import { addTocart } from '../../../redux/actions/cart';
import { toast } from 'react-toastify';

const ProductCard = ({ data }) => {
  const dispatch = useDispatch();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useSelector((state) => state.user);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);

  const isInWishlist = wishlist?.find((item) => item._id === data._id);
  const isInCart = cart?.find((item) => item._id === data._id);

  const getMockupUrl = (color = 'white', view = 'front') => {
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    return `${baseUrl}v1/hoodies/hoodie-${color}-${view}.png`;
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(data._id));
        toast.success("Removed from wishlist!");
      } else {
        await dispatch(addToWishlist(data));
        toast.success("Added to wishlist!");
      }
    } catch (error) {
      toast.error("Something went wrong!");
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    try {
      const cartData = {
        ...data,
        selectedColor: 'white',
        selectedSize: 'M',
        quantity: 1,
      };

      await dispatch(addTocart(cartData));
      toast.success("Added to cart!");
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: data.name,
          text: `Check out this ${data.name} on PODokan!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share product");
    }
  };

  return (
    <motion.div
      className="relative group w-full max-w-[280px] mx-auto bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link to={`/product/${data._id}`}>
        <div className="relative overflow-hidden rounded-t-xl aspect-[3/4]">
          {/* Product Images with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isHovered ? 'mockup' : 'design'}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {isHovered ? (
                // Mockup with Design Overlay
                <div className="relative w-full h-full">
                  <img
                    src={getMockupUrl('white', 'front')}
                    className="w-full h-full object-cover"
                    alt={data.name}
                    onLoad={() => setIsLoading(false)}
                  />
                  <motion.img
                    src={data.designImage?.url}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    alt="Design"
                  />
                </div>
              ) : (
                // Design Only
                <img
                  src={data.designImage?.url}
                  className="w-full h-full object-contain p-4"
                  alt={data.name}
                  onLoad={() => setIsLoading(false)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
          )}

          {/* Overlay with Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
          >
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2"
              >
                <span className="text-white font-semibold">
               EGP{data.discountPrice || data.originalPrice}
                </span>
                {data.discountPrice && (
                  <span className="text-gray-300 line-through text-sm">
                 EGP{data.originalPrice}
                  </span>
                )}
              </motion.div>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleWishlist}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                >
                  {isInWishlist ? (
                    <AiFillHeart className="text-red-500" size={20} />
                  ) : (
                    <AiOutlineHeart className="text-white" size={20} />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddToCart}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                >
                  <AiOutlineShoppingCart className={isInCart ? "text-blue-500" : "text-white"} size={20} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                >
                  <IoMdShare className="text-white" size={20} />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Sale Badge */}
          {data.discountPrice && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              {Math.round(((data.originalPrice - data.discountPrice) / data.originalPrice) * 100)}% OFF
            </motion.div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-gray-800 text-lg font-medium truncate">
            {data.name}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            by {data.shop?.name}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;