import React from 'react';
import PropTypes from 'prop-types';
import { PRODUCT_TYPES } from './constants/productConfig';
import { toast } from "react-toastify";

// Add default product config
const DEFAULT_PRODUCT_CONFIG = {
  basePrice: 850,
  productionCost: 650,
  margins: {
    min: 0.15,
    recommended: 0.30
  }
};


const PriceCalculator = ({ 
  productType = 'hoodie', // Add default value
  originalPrice, 
  discountPrice, 
  onChange, 
  disabled 
}) => {
  const productConfig = PRODUCT_TYPES[productType] || DEFAULT_PRODUCT_CONFIG;
  const minPrice = productConfig?.basePrice || DEFAULT_PRODUCT_CONFIG.basePrice;
  const recommendedPrice = Math.ceil(
    (productConfig?.productionCost || DEFAULT_PRODUCT_CONFIG.productionCost) / 
    (1 - (productConfig?.margins.recommended || DEFAULT_PRODUCT_CONFIG.margins.recommended))
  );
  const validatePrice = (type, value) => {
    const numValue = Number(value);
    
    if (type === 'original') {
      if (numValue < minPrice) {
        toast.error(`Original price must be at least ${minPrice} THB`);
        return false;
      }
    } else if (type === 'discount') {
      if (numValue > originalPrice) {
        toast.error('Discount price cannot be greater than original price');
        return false;
      }
    }
    return true;
  };
  // Rest of your component remains the same
  const handlePriceChange = (type, value) => {
    if (!validatePrice(type, value)) return;
    
    const numValue = parseFloat(value);
    if (type === 'original') {
      onChange({
        originalPrice: numValue,
        discountPrice: discountPrice > numValue ? numValue : discountPrice
      });
    } else {
      onChange({
        originalPrice,
        discountPrice: numValue
      });
    }
  };
  
  const calculateMargin = (price) => {
    if (!price) return 0;
    const prodCost = productConfig?.productionCost || DEFAULT_PRODUCT_CONFIG.productionCost;
    return ((price - prodCost) / price * 100).toFixed(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Price Configuration
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price Inputs */}
        <div className="space-y-4">
          {/* Original Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Price
            </label>
            <div className="flex items-center">
              <input
                type="number"
                value={originalPrice || ''}
                onChange={(e) => handlePriceChange('original', e.target.value)}
                disabled={disabled}
                min={minPrice}
                step="10"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-500">THB</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Margin: {calculateMargin(originalPrice)}%
            </p>
          </div>

          {/* Discount Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Price (Optional)
            </label>
            <div className="flex items-center">
              <input
                type="number"
                value={discountPrice || ''}
                onChange={(e) => handlePriceChange('discount', e.target.value)}
                disabled={disabled || !originalPrice}
                min={minPrice}
                max={originalPrice}
                step="10"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-500">THB</span>
            </div>
            {discountPrice && (
              <p className="mt-1 text-sm text-gray-500">
                Margin: {calculateMargin(discountPrice)}%
              </p>
            )}
          </div>
        </div>

        {/* Price Information */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Price:</span>
            <span className="font-medium">{minPrice} THB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Production Cost:</span>
            <span className="font-medium">{productConfig.productionCost} THB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Recommended Price:</span>
            <span className="font-medium">{recommendedPrice} THB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Minimum Margin:</span>
            <span className="font-medium">{productConfig.margins.min * 100}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Recommended Margin:</span>
            <span className="font-medium">{productConfig.margins.recommended * 100}%</span>
          </div>
          
          {originalPrice && (
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-600">Current Margin:</span>
                <span className={`
                  ${calculateMargin(originalPrice) < productConfig.margins.min * 100 
                    ? 'text-red-600' 
                    : 'text-green-600'
                  }
                `}>
                  {calculateMargin(originalPrice)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

PriceCalculator.propTypes = {
  productType: PropTypes.string,
  originalPrice: PropTypes.number,
  discountPrice: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default PriceCalculator;