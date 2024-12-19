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

  // Intersection observer for lazy loading
  const [imageRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Refs for gestures and animations
  const mainImageRef = useRef(null);
  const previewRef = useRef(null);

  // Available options
  const SIZES = ["S", "M", "L", "XL", "2XL"];
  const COLORS = ["white", "black"];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -20 },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Smart view management based on design position
  const getOppositeView = useCallback(() => {
    return currentView === "front" ? "back" : "front";
  }, [currentView]);

  // Price calculation with memoization
  const calculatePrice = useCallback(() => {
    if (!data) return { original: 0, final: 0, discount: 0 };
    const original = parseFloat(data.originalPrice) || 0;
    const discount = data.discountPrice ? parseFloat(data.discountPrice) : null;
    const final = discount || original;
    const discountPercentage = discount
      ? Math.round(((original - discount) / original) * 100)
      : 0;
    return { original, final, discountPercentage };
  }, [data]);

  // Touch gesture handling
  useEffect(() => {
    if (!mainImageRef.current) return;

    let touchStartX = 0;
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        setCurrentView((prev) => (prev === "front" ? "back" : "front"));
      }
    };

    const element = mainImageRef.current;
    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Handlers
  const handleQuantityChange = useCallback((change) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + change)));
  }, []);

  const handleColorChange = useCallback((color) => {
    setSelectedColor(color);
  }, []);

  const handleSizeChange = useCallback((size) => {
    setSelectedSize(size);
  }, []);

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
        finalPrice: calculatePrice().final,
      };

      await dispatch(addTocart(cartData));
      toast.success("Added to cart!");
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    const isInWishlist = wishlist?.find((item) => item._id === data._id);
    if (isInWishlist) {
      dispatch(removeFromWishlist(data._id));
      toast.success("Removed from wishlist");
    } else {
      dispatch(addToWishlist(data));
      toast.success("Added to wishlist");
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!showZoom) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePosition({ x, y });
  }, [showZoom]);

  if (!data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const { original, final, discountPercentage } = calculatePrice();
  const isInWishlist = wishlist?.find((item) => item._id === data._id);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="relative">
            <motion.div
              ref={imageRef}
              variants={imageVariants}
              className="relative aspect-square rounded-lg bg-gray-100 overflow-hidden"
              onMouseEnter={() => setShowZoom(true)}
              onMouseLeave={() => setShowZoom(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                ref={mainImageRef}
                src={`/product/${data._id}/hoodies/hoodie-${selectedColor}-${currentView}.png`}
                alt={`${data.name} ${currentView} view`}
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
              {data.designImage && (
                <motion.img
                  src={data.designImage.url}
                  alt="Design"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3"
                  animate={{ opacity: inView ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>

            {/* Preview of opposite view */}
            <motion.div
              ref={previewRef}
              className="absolute -right-4 top-4 w-24 h-24 rounded-lg overflow-hidden shadow-lg cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView(getOppositeView())}
            >
              <img
                src={`/product/${data._id}/hoodies/hoodie-${selectedColor}-${getOppositeView()}.png`}
                alt={`${data.name} ${getOppositeView()} view`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  View {getOppositeView()}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Product Details Section */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {data.name}
            </h1>

            {/* Price */}
            <div className="flex items-center mb-6">
              <span className="text-3xl font-bold text-gray-900">
                ${final.toFixed(2)}
              </span>
              {discountPercentage > 0 && (
                <>
                  <span className="ml-2 text-lg text-gray-500 line-through">
                    ${original.toFixed(2)}
                  </span>
                  <span className="ml-2 text-green-600">
                    {discountPercentage}% OFF
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
                    onClick={() => handleColorChange(color)}
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
                    onClick={() => handleSizeChange(size)}
                    className={`py-2 text-center rounded-md transition-all duration-200 ${
                      selectedSize === size
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center border rounded-md w-32">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  <AiOutlineMinus />
                </motion.button>
                <span className="flex-1 text-center">{quantity}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-2 hover:bg-gray-100"
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
                {isLoading ? "Adding..." : "Add to Cart"}
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
    </motion.div>
  );
};

export default ProductDetails;