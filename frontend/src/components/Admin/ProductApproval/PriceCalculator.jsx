import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { PRODUCT_TYPES } from './constants/productConfig';

const PriceCalculator = ({ productType, originalPrice, discountPrice, onChange, disabled }) => {
  const productConfig = PRODUCT_TYPES[productType];

  const calculations = useMemo(() => {
    const basePrice = productConfig.basePrice;
    const productionCost = productConfig.productionCost;
    
    const currentMargin = originalPrice 
      ? ((originalPrice - productionCost) / originalPrice).toFixed(2)
      : 0;
    
    const recommendedPrice = Math.ceil(
      productionCost / (1 - productConfig.margins.recommended)
    );

    const minPrice = Math.ceil(
      productionCost / (1 - productConfig.margins.min)
    );

    return {
      basePrice,
      productionCost,
      currentMargin,
      recommendedPrice,
      minPrice
    };
  }, [productType, originalPrice, productConfig]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Price Configuration
      </h3>

      <div className="space-y-4">
        {/* Original Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Original Price
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={originalPrice || ''}
              onChange={(e) => onChange({ 
                originalPrice: Number(e.target.value),
                discountPrice: Math.min(
                  Number(e.target.value),
                  discountPrice || Number(e.target.value)
                )
              })}
              disabled={disabled}
              min={calculations.minPrice}
              step="10"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">THB</span>
          </div>
        </div>

        {/* Discount Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Price (Optional)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={discountPrice || ''}
              onChange={(e) => onChange({ 
                discountPrice: Math.min(
                  Number(e.target.value),
                  originalPrice
                )
              })}
              disabled={disabled}
              min={calculations.minPrice}
              max={originalPrice}
              step="10"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">THB</span>
          </div>
        </div>

        {/* Price Information */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Price:</span>
            <span className="font-medium">{calculations.basePrice} THB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Production Cost:</span>
            <span className="font-medium">{calculations.productionCost} THB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current Margin:</span>
            <span className="font-medium">{(calculations.currentMargin * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Recommended Price:</span>
            <span className="font-medium">{calculations.recommendedPrice} THB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Minimum Price:</span>
            <span className="font-medium">{calculations.minPrice} THB</span>
          </div>
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