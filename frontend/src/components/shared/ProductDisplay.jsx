// components/shared/ProductDisplay.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ShareButton from './ShareButton';
import { useDispatch } from 'react-redux';
import { addTocart } from '../../redux/actions/cart';
import { addToWishlist, removeFromWishlist } from '../../redux/actions/wishlist';
import { toast } from 'react-toastify';

const ProductDisplay = ({ data }) => {
  const {
    _id,
    name,
    description,
    originalPrice,
    discountPrice,
    stock,
    designImage,
    DesignScale = 1, // Default scale if not provided
    colors = ["white", "black"], // Default colors
    sizes = ["S", "M", "L", "XL", "2XL"], // Default sizes
  } = data;

  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedSize, setSelectedSize] = useState("L");
  const [quantity, setQuantity] = useState(1);
  const [showBack, setShowBack] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const dispatch = useDispatch();

  const discount = originalPrice
    ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
    : 0;

  // Get base product image based on selected color
  const getBaseImage = () => {
    return `/products/${selectedColor.toLowerCase()}-${
      showBack ? "back" : "front"
    }.png`;
  };

  const handleAddToCart = async () => {
    if (stock < quantity) {
      toast.error("Not enough stock available");
      return;
    }

    const cartData = {
      ...data,
      selectedColor,
      selectedSize,
      quantity,
    };

    const result = await dispatch(addTocart(cartData));
    if (result.success) {
      toast.success("Added to cart successfully!");
    } else {
      toast.error(result.message || "Failed to add to cart");
    }
  };

  const toggleWishlist = () => {
    if (isInWishlist) {
      dispatch(removeFromWishlist(data));
      setIsInWishlist(false);
    } else {
      dispatch(addToWishlist(data));
      setIsInWishlist(true);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-xl">
      {/* Product Image Section */}
      <div className="relative">
        <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
          <img
            src={getBaseImage()}
            alt={name}
            className="w-full h-full object-cover"
          />
          {!showBack && designImage && (
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                width: `${DesignScale * 40}%`, // Base size multiplied by scale
                height: `${DesignScale * 40}%`,
              }}
            >
              <img
                src={designImage}
                alt="Design"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* View Back Button */}
        <button
          onClick={() => setShowBack(!showBack)}
          className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full
            text-sm font-medium shadow-sm hover:bg-white transition-colors"
        >
          {showBack ? "View Front" : "View Back"}
        </button>
      </div>

      {/* Product Details Section */}
      <div className="flex flex-col gap-6">
        {/* Title and Price */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-3xl font-bold text-gray-900">
              ${discountPrice}
            </span>
            {originalPrice && (
              <>
                <span className="text-lg text-gray-500 line-through">
                  ${originalPrice}
                </span>
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stock Warning */}
        {stock <= 4 && stock > 0 && (
          <div className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-sm">
            Only {stock} items left! Order soon to secure yours.
          </div>
        )}

        {/* Color Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-900">Color</h3>
          <div className="mt-2 flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 ${
                  selectedColor === color
                    ? "border-blue-600"
                    : "border-gray-200"
                }`}
                style={{ backgroundColor: color.toLowerCase() }}
              />
            ))}
          </div>
        </div>

        {/* Size Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-900">Size</h3>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-2 text-sm font-medium rounded-md ${
                  selectedSize === size
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.min(stock, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
              className="w-16 text-center border rounded-md"
            />
            <button
              onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Description */}
        {description && <p className="text-gray-600">{description}</p>}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleAddToCart}
            disabled={stock === 0}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-white 
              ${
                stock === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
          <button
            onClick={toggleWishlist}
            className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <motion.svg
              whileTap={{ scale: 0.8 }}
              className={`w-6 h-6 ${
                isInWishlist ? "text-red-500 fill-current" : "text-gray-600"
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </motion.svg>
          </button>
          <ShareButton url={_id} title={name} />
        </div>
      </div>
    </div>
  );
};

export default ProductDisplay;