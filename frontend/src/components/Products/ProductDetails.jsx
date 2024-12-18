// components/Products/ProductDetails.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
  AiOutlineZoomIn,
  AiOutlineShareAlt,
} from "react-icons/ai";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { toast } from "react-toastify";
import { addToWishlist, removeFromWishlist } from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import Accordion from '@mui/material/Accordion';
const ProductDetails = ({ data }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.user);

  // State management
  const [currentView, setCurrentView] = useState('front');
  const [currentColor, setCurrentColor] = useState(data?.ProductColor || 'white');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Refs
  const imageContainerRef = useRef(null);
  const productImagesRef = useRef(null);

  // Computed values
  const isInWishlist = wishlist?.find((item) => item._id === data._id);
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].filter(size => 
    data?.sizes?.includes(size) || true // Remove true if you have actual size data
  );

  // Price calculations
  const calculatePrices = useCallback(() => {
    const originalPrice = parseFloat(data?.originalPrice) || 0;
    const discountPrice = data?.discountPrice ? parseFloat(data.discountPrice) : null;
    const finalPrice = discountPrice || originalPrice;
    const discountPercentage = discountPrice 
      ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
      : 0;
    const installmentPrice = (finalPrice / 3).toFixed(2);

    return {
      originalPrice,
      finalPrice,
      discountPercentage,
      installmentPrice
    };
  }, [data]);

  const prices = calculatePrices();

  // Image zoom functionality
  const handleImageZoom = useCallback((e) => {
    if (!isZoomed || !imageContainerRef.current) return;

    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({ x, y });
  }, [isZoomed]);

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed);
    if (isZoomed) {
      setZoomPosition({ x: 0, y: 0 });
    }
  };

  // Image gallery navigation
  const handleImageNav = (direction) => {
    const totalImages = data.images?.length || 1;
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  // Share functionality
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: data.DesignTitle,
          text: data.Description,
          url: window.location.href,
        });
      } else {
        // Fallback copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Cart functionality
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
      const cartItem = cart?.find(
        (item) => 
          item._id === data._id && 
          item.selectedColor === currentColor && 
          item.selectedSize === selectedSize
      );

      if (cartItem) {
        toast.error("Item already in cart with these options");
        return;
      }

      const cartData = {
        ...data,
        selectedColor: currentColor,
        selectedSize: selectedSize,
        qty: quantity,
        finalPrice: prices.finalPrice
      };

      await dispatch(addTocart(cartData));
      toast.success("Added to cart successfully!");
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  // Wishlist functionality
  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    if (isInWishlist) {
      dispatch(removeFromWishlist(data._id));
      toast.success("Removed from wishlist");
    } else {
      dispatch(addToWishlist(data));
      toast.success("Added to wishlist");
    }
  };

  // Start of JSX
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image Section */}
          <div className="relative">
            {/* Main Image Container */}
            <div 
              ref={imageContainerRef}
              className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100
                ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={handleZoomToggle}
              onMouseMove={handleImageZoom}
              onMouseLeave={() => isZoomed && setIsZoomed(false)}
            >
              <img
                src={data.images?.[currentImageIndex] || data.mainImage}
                alt={data.DesignTitle}
                className={`w-full h-full object-contain transition-transform duration-300
                  ${isZoomed ? 'scale-150' : 'scale-100'}`}
                style={isZoomed ? {
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                } : undefined}
              />

              {/* Design Overlay */}
              {data.designImage && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: `${data.DesignWidth || 200}px`,
                    height: `${data.DesignHeight || 200}px`,
                    transform: `translate(-50%, -50%) scale(${data.DesignScale || 1})`
                  }}
                >
                  <img
                    src={data.designImage?.url || data.designImage}
                    alt="Design"
                    className="w-full h-full object-contain"
                    style={{
                      mixBlendMode: currentColor === 'white' ? 'multiply' : 'screen'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Image Navigation */}
            {(data.images?.length > 1 || data.views?.length > 1) && (
              <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4">
                <button
                  onClick={() => handleImageNav('prev')}
                  className="p-2 rounded-full bg-white/80 shadow-lg hover:bg-white
                    transition-colors duration-200"
                >
                  <BiChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleImageNav('next')}
                  className="p-2 rounded-full bg-white/80 shadow-lg hover:bg-white
                    transition-colors duration-200"
                >
                  <BiChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Thumbnail Gallery */}
            <div 
              ref={productImagesRef}
              className="mt-4 grid grid-cols-4 gap-2"
            >
              {data.images?.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square rounded-md overflow-hidden
                    ${currentImageIndex === index ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'}`}
                >
                  <img
                    src={image}
                    alt={`${data.DesignTitle} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-6">
          <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            {/* Header and Basic Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {data.DesignTitle}
                </h1>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Share product"
                >
                  <AiOutlineShareAlt className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                {/* Rating Display */}
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, index) => (
                      <svg
                        key={index}
                        className={`w-4 h-4 ${
                          index < (data.ratings || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {data.ratings || 0} ({data.reviews?.length || 0} reviews)
                  </span>
                </div>

                {/* Product ID/SKU */}
                <span className="text-sm text-gray-500">
                  SKU: {data._id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-bold text-gray-900">
                  egp{prices.finalPrice.toFixed(2)}
                </span>
                {prices.discountPercentage > 0 && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      egp{prices.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      Save {prices.discountPercentage}%
                    </span>
                  </>
                )}
              </div>
              
              {/* Payment Options */}
              <div className="text-sm text-gray-600">
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Color: {currentColor}</h3>
                <span className="text-sm text-gray-500">
                  {data.availableColors?.length || 0} colors available
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.availableColors?.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`
                      w-12 h-12 rounded-full relative
                      ${currentColor === color 
                        ? 'ring-2 ring-offset-2 ring-blue-500' 
                        : 'ring-1 ring-gray-200'
                      }
                      transition-all duration-200 transform
                      hover:scale-110
                    `}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color} color`}
                  >
                    {currentColor === color && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg 
                          className={`w-6 h-6 ${
                            ['white', 'yellow', 'beige'].includes(color) 
                              ? 'text-gray-900' 
                              : 'text-white'
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Size</h3>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`
                      py-3 px-4 rounded-md text-sm font-medium
                      ${selectedSize === size
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                      }
                      transition-all duration-200
                      ${size === 'OUT' ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={size === 'OUT'}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > 0) setQuantity(val);
                  }}
                  className="w-12 text-center border-x py-2 text-gray-900"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className={`
                  w-full py-4 px-6 rounded-lg
                  flex items-center justify-center gap-2
                  ${isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'}
                  text-white font-medium
                  transition-colors duration-200
                `}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <AiOutlineShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleWishlist}
                  className={`
                    flex-1 py-3 px-6 rounded-lg
                    flex items-center justify-center gap-2
                    ${isInWishlist ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-900'}
                    hover:bg-gray-100
                    transition-colors duration-200
                  `}
                >
                  {isInWishlist ? (
                    <AiFillHeart className="w-5 h-5" />
                  ) : (
                    <AiOutlineHeart className="w-5 h-5" />
                  )}
                  Wishlist
                </button>

                {data.shop && (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error("Please login to message seller");
                        return;
                      }
                      navigate(`/inbox?shop=${data.shop._id}`);
                    }}
                    className="
                      flex-1 py-3 px-6 rounded-lg
                      flex items-center justify-center gap-2
                      bg-gray-50 text-gray-900
                      hover:bg-gray-100
                      transition-colors duration-200
                    "
                  >
                    <AiOutlineMessage className="w-5 h-5" />
                    Message Seller
                  </button>
                )}
              </div>
            </div>

            {/* Product Details Accordion */}
            <div className="border-t pt-6 space-y-6">
              <Accordion title="Product Description">
                <p className="text-gray-600">{data.Description}</p>
              </Accordion>

              <Accordion title="Shipping Information">
                <div className="space-y-2 text-gray-600">
                  <p>• Free shipping on orders over 1000egp</p>
                  <p>• Estimated delivery: 5-7 business days</p>
                  <p>• International shipping available</p>
                </div>
              </Accordion>

              <Accordion title="Return Policy">
                <div className="space-y-2 text-gray-600">
                  <p>• 30-day return policy</p>
                  <p>• Items must be unworn with original tags</p>
                  <p>• See our full return policy for details</p>
                </div>
              </Accordion>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;