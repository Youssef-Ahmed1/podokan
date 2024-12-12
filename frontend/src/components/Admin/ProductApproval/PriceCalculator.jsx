import React from 'react';
import PropTypes from 'prop-types';
import { PRODUCT_TYPES } from './constants/productConfig';

const PriceCalculator = ({ 
  productType, 
  originalPrice, 
  discountPrice, 
  onChange, 
  disabled 
}) => {
  const productConfig = PRODUCT_TYPES[productType];
  const minPrice = productConfig.basePrice;
  const recommendedPrice = Math.ceil(productConfig.productionCost / (1 - productConfig.margins.recommended));

  const handlePriceChange = (type, value) => {
    const numValue = Math.max(minPrice, Number(value));
    
    if (type === 'original') {
      onChange({
        originalPrice: numValue,
        discountPrice: discountPrice > numValue ? numValue : discountPrice
      });
    } else {
      onChange({
        originalPrice,
        discountPrice: Math.min(numValue, originalPrice)
      });
    }
  };

  const calculateMargin = (price) => {
    if (!price) return 0;
    return ((price - productConfig.productionCost) / price * 100).toFixed(1);
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
  productType: PropTypes.string.isRequired,
  originalPrice: PropTypes.number,
  discountPrice: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default PriceCalculator;