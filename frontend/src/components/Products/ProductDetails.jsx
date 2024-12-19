import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { toast } from "react-toastify";
import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineShoppingCart,
  AiOutlineMinus,
  AiOutlinePlus,
  AiOutlineShareAlt,
} from "react-icons/ai";
import { addToWishlist, removeFromWishlist } from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";

const ProductDetails = ({ data }) => {
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.user);
  
  // Core state management
  const [currentView, setCurrentView] = useState("front");
  const [selectedColor, setSelectedColor] = useState("white");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Check if product is in wishlist/cart
  const isInWishlist = wishlist?.find((item) => item._id === data?._id);
  const isInCart = cart?.find((item) => item._id === data?._id);

  // Refs and observers
  const [imageRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const mainImageRef = useRef(null);
  const previewRef = useRef(null);

  // Constants
  const SIZES = ["S", "M", "L", "XL", "2XL"];
  const COLORS = ["white", "black"];

  // Get mockup URL
  const getMockupUrl = useCallback((color, view) => {
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    return `${baseUrl}v1/hoodies/hoodie-${color}-${view}.png`;
  }, []);

  // Price calculations
  const calculatePrices = useCallback(() => {
    if (!data) return { original: 0, final: 0, discount: 0, percentage: 0 };
    
    const original = parseFloat(data.originalPrice) || 0;
    const final = data.discountPrice ? parseFloat(data.discountPrice) : original;
    const discount = original - final;
    const percentage = Math.round((discount / original) * 100);
    
    return { original, final, discount, percentage };
  }, [data]);

  // Handlers
  const handleQuantityChange = useCallback((change) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + change)));
  }, []);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    try {
      setIsLoading(true);
      const cartData = {
        ...data,
        selectedColor,
        selectedSize,
        quantity,
      };

      await dispatch(addTocart(cartData));
      toast.success("Added to cart successfully!");
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlist = async () => {
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
      toast.error("Failed to update wishlist");
    }
  };

  const handleShare = async () => {
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

  const handleMouseMove = useCallback((e) => {
    if (!showZoom) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePosition({ x, y });
  }, [showZoom]);

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="relative">
            <motion.div
              ref={imageRef}
              className="relative aspect-square rounded-lg bg-white overflow-hidden"
              onMouseEnter={() => setShowZoom(true)}
              onMouseLeave={() => setShowZoom(false)}
              onMouseMove={handleMouseMove}
            >
              {/* Main Product Image */}
              <img
                ref={mainImageRef}
                src={getMockupUrl(selectedColor, currentView)}
                alt={`${data?.name} ${currentView} view`}
                className="w-full h-full object-cover transition-transform duration-300"
                style={
                  showZoom
                    ? {
                        transform: "scale(2)",
                        transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                      }
                    : {}
                }
              />

              {/* Design Overlay */}
              {data?.designImage?.url && (
                <motion.img
                  src={data.designImage.url}
                  alt="Design"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: inView ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>

            {/* View Toggle Preview */}
            <motion.div
              ref={previewRef}
              className="absolute -right-4 top-4 w-24 h-24 rounded-lg overflow-hidden shadow-lg cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView(currentView === "front" ? "back" : "front")}
            >
              <img
                src={getMockupUrl(selectedColor, currentView === "front" ? "back" : "front")}
                alt={`${data?.name} alternate view`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  View {currentView === "front" ? "Back" : "Front"}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Product Details Section */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {data?.name}
            </h1>

            {/* Price Display */}
            <div className="flex items-center mb-6">
              <span className="text-3xl font-bold text-gray-900">
                ${calculatePrices().final.toFixed(2)}
              </span>
              {calculatePrices().percentage > 0 && (
                <>
                  <span className="ml-2 text-lg text-gray-500 line-through">
                    ${calculatePrices().original.toFixed(2)}
                  </span>
                  <span className="ml-2 text-green-600">
                    {calculatePrices().percentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Color</h3>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <motion.button
                    key={color}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      selectedColor === color
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
              <div className="grid grid-cols-5 gap-2">
                {SIZES.map((size) => (
                  <motion.button
                    key={size}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 text-center rounded-md transition-all duration-200 ${
                      selectedSize === size
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center border rounded-md w-32">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-2 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  <AiOutlineMinus />
                </motion.button>
                <span className="flex-1 text-center">{quantity}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-2 hover:bg-gray-100"
                  disabled={quantity >= 10}
                >
                  <AiOutlinePlus />
                </motion.button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AiOutlineShoppingCart size={20} />
                {isLoading ? "Adding..." : isInCart ? "Update Cart" : "Add to Cart"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWishlist}
                className="p-3 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                {isInWishlist ? (
                  <AiFillHeart size={20} className="text-red-500" />
                ) : (
                  <AiOutlineHeart size={20} />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="p-3 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                <AiOutlineShareAlt size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;