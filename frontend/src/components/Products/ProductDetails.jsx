import React, { useEffect, useState, useCallback, memo } from "react";
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

// Constants
const COLOR_OPTIONS = {
  white: { value: 'white', label: 'White', hex: '#ffffff', textColor: 'text-gray-800' },
  black: { value: 'black', label: 'Black', hex: '#000000', textColor: 'text-white' },
  red: { value: 'red', label: 'Red', hex: '#ff0000', textColor: 'text-white' },
  blue: { value: 'blue', label: 'Blue', hex: '#0000ff', textColor: 'text-white' },
  gray: { value: 'gray', label: 'Gray', hex: '#808080', textColor: 'text-white' }
};

const PRODUCT_TYPES = {
  't-shirt': { 
    value: 't-shirt', 
    label: 'T-Shirt', 
    additionalPrice: 0,
  },
  'hoodie': { 
    value: 'hoodie', 
    label: 'Hoodie', 
    additionalPrice: 200,
  },
  'long-sleeve': { 
    value: 'long-sleeve', 
    label: 'Long Sleeve', 
    additionalPrice: 120,
  }
};

const SIZE_OPTIONS = [
  { value: 'S', label: 'Small' },
  { value: 'M', label: 'Medium' },
  { value: 'L', label: 'Large' },
  { value: 'XL', label: 'Extra Large' },
];

const FIT_OPTIONS = [
  { value: 'male', label: 'Male Fit' },
  { value: 'female', label: 'Female Fit' },
];

const MATERIAL_OPTIONS = [
  { value: 'standard', label: 'Standard Material', multiplier: 1 },
  { value: 'premium', label: 'Premium Material', multiplier: 2 },
];

// SizeGuide Component
const SizeGuide = memo(({ onClose }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Size Guide</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Size</th>
                <th className="p-3">Chest (inches)</th>
                <th className="p-3">Length (inches)</th>
                <th className="p-3">Sleeve (inches)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { size: 'S', chest: '36-38', length: '27', sleeve: '8.5' },
                { size: 'M', chest: '39-41', length: '28', sleeve: '9' },
                { size: 'L', chest: '42-44', length: '29', sleeve: '9.5' },
                { size: 'XL', chest: '45-47', length: '30', sleeve: '10' },
              ].map((row) => (
                <tr key={row.size} className="border-b">
                  <td className="p-3 font-medium">{row.size}</td>
                  <td className="p-3 text-center">{row.chest}</td>
                  <td className="p-3 text-center">{row.length}</td>
                  <td className="p-3 text-center">{row.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-sm text-gray-600">
            <p>Measurements are approximate and may vary slightly by style.</p>
            <p className="mt-2">For best results, measure yourself and compare to the size chart above.</p>
            <p className="mt-2">If you're between sizes, order the larger size for a more comfortable fit.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
));

// ProductPreview Component
const ProductPreview = memo(({ 
  product, 
  selectedColor, 
  currentView, 
  onViewChange 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  const getMockupUrl = useCallback(() => {
    if (!product) return '';
    
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    const config = {
      hoodie: {
        version: "v1728392918",
        folder: "hoodies",
        filename: `hoodie-${selectedColor}-${currentView}`
      },
      "t-shirt": {
        version: "v1728393898",
        folder: "t-shirts",
        filename: `t-shirt-${selectedColor}-${currentView}`
      },
      "long-sleeve": {
        version: "v1728394665",
        folder: "long-sleeves",
        filename: selectedColor === "gray" 
          ? `longsleeves-${selectedColor}-${currentView}`
          : ["white", "black"].includes(selectedColor)
            ? `longseleves-${selectedColor}-${currentView}`
            : `t-shirt-${selectedColor}-${currentView}`
      }
    };

    const productConfig = config[product.ProductType];
    return productConfig 
      ? `${baseUrl}${productConfig.version}/${productConfig.folder}/${productConfig.filename}.png`
      : "";
  }, [product, selectedColor, currentView]);

  const getDesignImageUrl = useCallback(() => {
    if (!product?.designImage) return '';
    return typeof product.designImage === 'string' 
      ? product.designImage 
      : product.designImage.url || '';
  }, [product]);

  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="aspect-w-1 aspect-h-1 w-full">
        <div className="relative w-full h-full">
          {/* Main Product Image */}
          <img
            src={getMockupUrl()}
            alt={product.DesignTitle}
            className="w-full h-full object-contain"
            onLoad={() => setIsLoading(false)}
            style={{ opacity: isLoading ? 0 : 1 }}
          />

          {/* Design Overlay */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              transform: `translate(-50%, -50%) scale(${product.DesignScale})`,
              width: '200px',
              height: '200px'
            }}
          >
            <img
              src={getDesignImageUrl()}
              alt="Design"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <button
          onClick={() => onViewChange(currentView === 'front' ? 'back' : 'front')}
          className="px-4 py-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-all duration-200"
        >
          View {currentView === 'front' ? 'Back' : 'Front'}
        </button>
        <button
          onClick={() => setIsZoomed(true)}
          className="px-4 py-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-all duration-200"
        >
          Zoom
        </button>
      </div>

      {/* Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div 
            className="relative max-w-4xl w-full h-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={getMockupUrl()}
              alt={product.DesignTitle}
              className="max-w-full max-h-full object-contain"
            />
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                transform: `translate(-50%, -50%) scale(${product.DesignScale})`,
                width: '400px',
                height: '400px'
              }}
            >
              <img
                src={getDesignImageUrl()}
                alt="Design"
                className="w-full h-full object-contain"
              />
            </div>
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <span className="text-3xl">×</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});// PriceDisplay Component
const PriceDisplay = memo(({ 
  product, 
  selectedMaterial 
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const calculateFinalPrice = useCallback(() => {
    const basePrice = product.originalPrice;
    const additionalPrice = PRODUCT_TYPES[product.ProductType]?.additionalPrice || 0;
    const materialMultiplier = selectedMaterial === 'premium' ? 2 : 1;
    
    const totalPrice = (basePrice + additionalPrice) * materialMultiplier;
    
    if (product.discountPrice) {
      const discountMultiplier = product.discountPrice / product.originalPrice;
      return totalPrice * discountMultiplier;
    }
    
    return totalPrice;
  }, [product, selectedMaterial]);

  const originalPrice = calculateFinalPrice();
  const finalPrice = product.discountPrice 
    ? calculateFinalPrice() 
    : originalPrice;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-baseline space-x-3">
          <span className="text-3xl font-bold">
            £{finalPrice.toFixed(2)}
          </span>
          {product.discountPrice && product.discountPrice < product.originalPrice && (
            <>
              <span className="text-lg line-through text-gray-500">
                £{originalPrice.toFixed(2)}
              </span>
              <span className="text-sm text-green-600 font-medium">
                {(((originalPrice - finalPrice) / originalPrice) * 100).toFixed(0)}% OFF
              </span>
            </>
          )}
        </div>

        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showBreakdown ? 'Hide price details' : 'Show price details'}
        </button>

        {showBreakdown && (
          <div className="mt-4 space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Base Price:</span>
              <span className="font-medium">£{product.originalPrice.toFixed(2)}</span>
            </div>
            
            {PRODUCT_TYPES[product.ProductType]?.additionalPrice > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Product Type Addition:</span>
                <span className="font-medium">
                  +£{PRODUCT_TYPES[product.ProductType].additionalPrice.toFixed(2)}
                </span>
              </div>
            )}

            {selectedMaterial === 'premium' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Premium Material:</span>
                <span className="text-green-600">×2</span>
              </div>
            )}

            {product.discountPrice && product.discountPrice < product.originalPrice && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Discount Applied:</span>
                <span className="text-red-600">
                  -{(((originalPrice - finalPrice) / originalPrice) * 100).toFixed(0)}%
                </span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Final Price:</span>
              <span className="font-bold text-lg">£{finalPrice.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Main ProductDetails Component
const ProductDetails = memo(({ data }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  
  const [selectedColor, setSelectedColor] = useState(data?.ProductColor || 'white');
  const [currentView, setCurrentView] = useState('front');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedFit, setSelectedFit] = useState('male');
  const [selectedMaterial, setSelectedMaterial] = useState('standard');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isInWishlist = wishlist?.find((item) => item._id === data?._id);

  const handleMessageSeller = () => {
    if (!isAuthenticated) {
      toast.error("Please login to contact seller");
      return;
    }
    navigate(`/inbox?conversation=${data.shop._id}`);
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to add to wishlist");
      return;
    }
    if (isInWishlist) {
      dispatch(removeFromWishlist(data._id));
      toast.success("Product removed from wishlist");
    } else {
      dispatch(addToWishlist(data));
      toast.success("Product added to wishlist");
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add to cart");
      return;
    }
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    setIsAddingToCart(true);
    try {
      const cartData = {
        ...data,
        selectedColor,
        selectedSize,
        selectedFit,
        selectedMaterial,
        qty: 1,
      };
      await dispatch(addTocart(cartData));
      toast.success("Product added to cart");
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Product Preview */}
          <div className="space-y-6">
            <ProductPreview
              product={data}
              selectedColor={selectedColor}
              currentView={currentView}
              onViewChange={setCurrentView}
            />

            {/* Color Selection */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Available Colors</h3>
              <div className="flex flex-wrap gap-4">
                {Object.entries(COLOR_OPTIONS).map(([key, color]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedColor(key)}
                    className={`
                      group relative p-2 rounded-lg transition-all duration-200
                      ${selectedColor === key 
                        ? 'ring-2 ring-blue-500' 
                        : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div 
                        className="w-8 h-8 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className={`text-sm ${color.textColor}`}>
                        {color.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {data.DesignTitle}
              </h1>
              <div className="mt-2 flex items-center space-x-4">
                <Ratings rating={data?.ratings} />
                <span className="text-gray-500">
                  ({data?.reviews?.length || 0} reviews)
                </span>
              </div>
            </div>

            {/* Price Display */}
            <PriceDisplay
              product={data}
              selectedMaterial={selectedMaterial}
            />

            {/* Size Selection */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Size</h3>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SIZE_OPTIONS.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setSelectedSize(size.value)}
                    className={`
                      py-3 rounded-lg transition-all duration-200
                      ${selectedSize === size.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'}
                    `}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fit Selection */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Select Fit</h3>
              <div className="grid grid-cols-2 gap-4">
                {FIT_OPTIONS.map((fit) => (
                  <button
                    key={fit.value}
                    onClick={() => setSelectedFit(fit.value)}
                    className={`
                      py-3 rounded-lg transition-all duration-200
                      ${selectedFit === fit.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'}
                    `}
                  >
                    {fit.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Material Selection */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Select Material</h3>
              <div className="grid grid-cols-2 gap-4">
                {MATERIAL_OPTIONS.map((material) => (
                  <button
                    key={material.value}
                    onClick={() => setSelectedMaterial(material.value)}
                    className={`
                      p-4 rounded-lg transition-all duration-200
                      ${selectedMaterial === material.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'}
                    `}
                  >
                    <div className="text-center">
                      <div className="font-medium">{material.label}</div>
                      <div className="text-sm mt-1">
                        {material.value === 'premium' ? '2x Quality' : 'Standard Quality'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={`
                  flex-1 py-3 px-6 rounded-lg text-white font-medium
                  transition-all duration-200 flex items-center justify-center
                  ${isAddingToCart
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'}
                `}
              >
                {isAddingToCart ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <AiOutlineShoppingCart className="text-xl mr-2" />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={handleAddToWishlist}
                className="flex-1 py-3 px-6 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
              >
                {isInWishlist ? (
                  <AiFillHeart className="text-xl text-red-500 mx-auto" />
                ) : (
                  <AiOutlineHeart className="text-xl mx-auto" />
                )}
              </button>

              <button
                onClick={handleMessageSeller}
                className="flex-1 py-3 px-6 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
              >
                <AiOutlineMessage className="text-xl mx-auto" />
              </button>
            </div>

            {/* Product Description */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Description</h3>
              <p className="text-gray-600 whitespace-pre-line">
                {data.Description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <SizeGuide onClose={() => setShowSizeGuide(false)} />
      )}
    </div>
  );
});

export default ProductDetails;