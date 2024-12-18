// components/Products/ProductDetails.jsx
import React, { useState, useEffect } from "react";
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

const ProductDetails = ({ data }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.user);

  // Core state
  const [currentView, setCurrentView] = useState('front');
  const [currentColor, setCurrentColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Set initial color when data loads
  useEffect(() => {
    if (data?.availableColors?.length) {
      setCurrentColor(data.availableColors[0]);
    }
  }, [data]);

  const isInWishlist = wishlist?.find((item) => item._id === data._id);
  const finalPrice = data?.discountPrice || data?.originalPrice || 0;

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
        finalPrice
      };

      await dispatch(addTocart(cartData));
      toast.success("Added to cart successfully!");
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

    if (isInWishlist) {
      dispatch(removeFromWishlist(data._id));
      toast.success("Removed from wishlist");
    } else {
      dispatch(addToWishlist(data));
      toast.success("Added to wishlist");
    }
  };

  if (!data) return null;

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={data.mainImage}
                alt={data.DesignTitle}
                className="w-full h-full object-contain"
              />
              {data.designImage && (
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
                    className="w-full h-full object-contain"
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
                onClick={() => setCurrentView('front')}
                className={`px-4 py-2 rounded-lg ${
                  currentView === 'front' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Front View
              </button>
              <button
                onClick={() => setCurrentView('back')}
                className={`px-4 py-2 rounded-lg ${
                  currentView === 'back' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Back View
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.DesignTitle}</h1>
              <p className="mt-4 text-3xl font-bold text-gray-900">
                EGP {finalPrice.toFixed(2)}
              </p>
              {data.discountPrice && (
                <p className="mt-1 text-lg text-gray-500 line-through">
                  EGP {data.originalPrice.toFixed(2)}
                </p>
              )}
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Color</h3>
              <div className="flex gap-2">
                {data.availableColors?.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      currentColor === color 
                        ? 'border-blue-500' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Size</h3>
              <div className="grid grid-cols-4 gap-2">
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
              <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
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

            {/* Actions */}
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
              <p className="mt-4 text-gray-600">{data.Description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;