// In components/Products/ProductDetails.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { toast } from "react-toastify";
import { addToWishlist, removeFromWishlist } from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import Ratings from "./Ratings";

const ProductDetails = ({ data }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.user);

  const [currentView, setCurrentView] = useState('front');
  const [currentColor, setCurrentColor] = useState(data?.ProductColor || 'white');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [mockupLoaded, setMockupLoaded] = useState(false);
  const [designLoaded, setDesignLoaded] = useState(false);

  // Initialize with default color if available
  useEffect(() => {
    if (data?.availableColors?.length > 0) {
      setCurrentColor(data.availableColors[0]);
    }
  }, [data]);

  // Get mockup URL based on product type and color
  const getMockupUrl = useCallback(() => {
    if (!data) return '';
    
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    const getFileName = () => {
      switch(data.ProductType) {
        case 't-shirt':
          return `t-shirt-${currentColor}-${currentView}`;
        case 'hoodie':
          return `hoodie-${currentColor}-${currentView}`;
        case 'long-sleeves':
          return currentColor === "gray" 
            ? `longsleeves-${currentColor}-${currentView}`
            : ["white", "black"].includes(currentColor)
              ? `longseleves-${currentColor}-${currentView}`
              : `t-shirt-${currentColor}-${currentView}`;
        default:
          return `t-shirt-${currentColor}-${currentView}`;
      }
    };

    return `${baseUrl}v1/${data.ProductType}s/${getFileName()}.png`;
  }, [data, currentColor, currentView]);

  // Function to calculate final price
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

  // Function to handle view change with loading state
  const handleViewChange = useCallback((view) => {
    setMockupLoaded(false);
    setDesignLoaded(false);
    setCurrentView(view);
  }, []);

  // Function to handle color change with loading state
  const handleColorChange = useCallback((color) => {
    setMockupLoaded(false);
    setDesignLoaded(false);
    setCurrentColor(color);
  }, []);

  // Add to cart handler
  const handleAddToCart = useCallback(async () => {
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
  }, [
    isAuthenticated, 
    selectedSize, 
    currentColor, 
    quantity, 
    data, 
    dispatch, 
    cart, 
    calculatePrice
  ]);

  // Wishlist handlers
  const handleWishlist = useCallback(() => {
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
  }, [isAuthenticated, wishlist, data, dispatch]);

  if (!data) return null;

  const { original, final, discountPercentage } = calculatePrice();
  const isInWishlist = wishlist?.find((item) => item._id === data._id);

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image Section */}
          <div className="relative">
            {/* Loading Overlay */}
            {(!mockupLoaded || !designLoaded) && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            )}

            {/* Mockup Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={getMockupUrl()}
                alt={`${data.ProductType} ${currentColor} ${currentView}`}
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  mockupLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setMockupLoaded(true)}
              />

              {/* Design Overlay */}
              {mockupLoaded && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: '200px',
                    height: '200px',
                    transform: `translate(-50%, -50%) scale(${data.DesignScale || 1})`
                  }}
                >
                  <img
                    src={data.designImage?.url || data.designImage}
                    alt="Design"
                    className={`w-full h-full object-contain transition-opacity duration-300 ${
                      designLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setDesignLoaded(true)}
                    style={{
                      mixBlendMode: currentColor === 'white' ? 'multiply' : 'screen'
                    }}
                  />
                </div>
              )}
            </div>

            {/* View Controls */}
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => handleViewChange('front')}
                className={`px-4 py-2 rounded-lg ${
                  currentView === 'front' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Front View
              </button>
              <button
                onClick={() => handleViewChange('back')}
                className={`px-4 py-2 rounded-lg ${
                  currentView === 'back' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Back View
              </button>
            </div>

            {/* Color Selection */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Colors</h3>
              <div className="mt-2 flex gap-2">
                {data.availableColors?.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      currentColor === color 
                        ? 'border-blue-500' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.DesignTitle}</h1>
              <div className="mt-2">
                <Ratings rating={data.ratings} />
                <span className="ml-2 text-gray-500">
                  ({data.reviews?.length || 0} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <p className="text-3xl font-bold text-gray-900">
                  EGP {final.toFixed(2)}
                </p>
                {discountPercentage > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg text-gray-500 line-through">
                      EGP {original.toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {discountPercentage}% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-900">Size</h3>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {['S', 'M', 'L', 'XL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 rounded-lg text-sm font-medium ${
                      selectedSize === size
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-900">
                Quantity
              </label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-1 border-x">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className={`flex-1 py-3 px-6 rounded-lg text-white font-medium
                  ${isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'}
                `}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mx-auto" />
                ) : (
                  <>
                    <AiOutlineShoppingCart className="inline-block mr-2" />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={handleWishlist}
                className="p-3 rounded-lg border hover:bg-gray-50"
              >
                {isInWishlist ? (
                  <AiFillHeart className="text-red-500" size={24} />
                ) : (
                  <AiOutlineHeart size={24} />
                )}
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
                  className="p-3 rounded-lg border hover:bg-gray-50"
                >
                  <AiOutlineMessage size={24} />
                </button>
              )}
            </div>

            {/* Description */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
              <div className="mt-4 prose prose-sm text-gray-500">
                {data.Description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;