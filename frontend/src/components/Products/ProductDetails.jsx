import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineShoppingCart,
  AiOutlineShareAlt,
  AiOutlineArrowLeft,
  AiOutlineMinus,
  AiOutlinePlus,
} from "react-icons/ai";
import { toast } from "react-toastify";
import { addToWishlist, removeFromWishlist } from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import Ratings from "./Ratings";

const ProductDetails = ({ data }) => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.user);

  const [currentView, setCurrentView] = useState('front');
  const [currentColor, setCurrentColor] = useState('white');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showZoom, setShowZoom] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Available options
  const SIZES = ['S', 'M', 'L', 'XL', '2XL'];
  const COLORS = {
    white: 'White',
    black: 'Black',
    navy: 'Navy Blue',
    gray: 'Heather Gray'
  };

  // Animation variants
  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  // URL formatting functions
  const formatForURL = useCallback((string) => {
    if (!string) return '';
    return string
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  const getFormattedProductURL = useCallback(() => {
    if (!data?.DesignTitle) return '';
    const baseURL = window.location.origin;
    const formattedTitle = formatForURL(data.DesignTitle);
    return `${baseURL}/p/${formattedTitle}`;
  }, [data, formatForURL]);

  // Price calculation
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

  // Initialize and validate data
  useEffect(() => {
    if (data) {
      if (data.availableColors?.length > 0) {
        setCurrentColor(data.availableColors[0]);
      }
      const correctSlug = formatForURL(data.DesignTitle);
      if (slug !== correctSlug) {
        navigate(`/p/${correctSlug}`, { replace: true });
      }
    }
  }, [data, slug, navigate, formatForURL]);

  // Image URL generation
  const getMockupUrl = useCallback(() => {
    if (!data) return '';
    return `${process.env.REACT_APP_MOCKUP_BASE_URL}/hoodies/hoodie-${currentColor}-${currentView}.png`;
  }, [currentColor, currentView, data]);

  const getDesignUrl = useCallback(() => {
    if (!data?.designImage?.url) return '';
    return data.designImage.url;
  }, [data]);

  // Handlers
  const handleQuantityChange = (change) => {
    const newQty = quantity + change;
    if (newQty >= 1 && newQty <= 10) {
      setQuantity(newQty);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = getFormattedProductURL();
      const shareData = {
        title: data.DesignTitle,
        text: `Check out this ${data.DesignTitle} on PODokan!`,
        url: shareUrl
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share product');
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
      const isItemInCart = cart?.find(
        (item) => 
          item._id === data._id && 
          item.selectedColor === currentColor && 
          item.selectedSize === selectedSize
      );

      if (isItemInCart) {
        toast.error("Item already in cart with these options");
        return;
      }

      const cartData = {
        ...data,
        selectedColor: currentColor,
        selectedSize: selectedSize,
        qty: quantity,
        finalPrice: calculatePrice().final
      };

      await dispatch(addTocart(cartData));
      toast.success("Item added to cart successfully!");
    } catch (error) {
      toast.error("Failed to add item to cart");
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
      toast.success("Item removed from wishlist");
    } else {
      dispatch(addToWishlist(data));
      toast.success("Item added to wishlist");
    }
  };

  // Handle image zoom
  const handleMouseMove = (e) => {
    if (!showZoom) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  // Error and loading states
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <button
            onClick={() => navigate('/')}
            className="text-blue-500 hover:text-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.DesignTitle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const { original, final, discountPercentage } = calculatePrice();
  const isInWishlist = wishlist?.find((item) => item._id === data._id);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="bg-white"
    >
      <Helmet>
        <title>{`${data.DesignTitle} | PODokan`}</title>
        <meta name="description" content={data.Description} />
        <meta property="og:title" content={data.DesignTitle} />
        <meta property="og:description" content={data.Description} />
        <meta property="og:image" content={getDesignUrl()} />
        <meta property="og:url" content={getFormattedProductURL()} />
        <link rel="canonical" href={getFormattedProductURL()} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <AiOutlineArrowLeft className="mr-2" />
          Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image Section */}
          <div className="relative">
            <div 
              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
              onMouseEnter={() => setShowZoom(true)}
              onMouseLeave={() => setShowZoom(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={getMockupUrl()}
                alt={`${data.DesignTitle} ${currentView} view`}
                className="w-full h-full object-cover"
                style={showZoom ? {
                  transform: 'scale(2)',
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`
                } : {}}
              />
              <img
                src={getDesignUrl()}
                alt={`${data.DesignTitle} design`}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3"
              />
            </div>

            {/* View toggles */}
            <div className="mt-4 flex justify-center gap-4">
              {['front', 'back'].map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-4 py-2 rounded-md capitalize ${
                    currentView === view
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {view} View
                </button>
              ))}
            </div>
          </div>

          {/* Product Details Section */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {data.DesignTitle}
            </h1>

            <div className="flex items-center mb-4">
              <Ratings rating={data.rating || 4.5} />
              <span className="ml-2 text-gray-600">
                ({data.numReviews || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center">
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
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Color</h3>
              <div className="flex gap-2">
                {Object.entries(COLORS).map(([color, label]) => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      currentColor === color
                        ? 'border-blue-500'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={label}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
              <div className="grid grid-cols-5 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 text-center rounded-md ${
                      selectedSize === size
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center border rounded-md w-32">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  <AiOutlineMinus />
                </button>
                <span className="flex-1 text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  <AiOutlinePlus />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
              >
                <AiOutlineShoppingCart size={20} />
                {isLoading ? 'Adding...' : 'Add to Cart'}
              </motion.button>

              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
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
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleShare}
                className="p-3 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                <AiOutlineShareAlt size={20} />
              </motion.button>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-600">{data.Description}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetails;