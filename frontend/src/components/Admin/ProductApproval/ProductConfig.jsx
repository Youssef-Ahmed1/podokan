import React, { useCallback } from 'react';
import { 
  PRODUCT_TYPES, 
  AVAILABLE_TYPES, 
  getAvailableColorsForProduct,
  getAvailableViews,
  DEFAULT_PRODUCT_CONFIG 
} from '../ProductApproval/constants/productConfig';

const ProductConfig = ({ editedProduct, onUpdate, onDesignPositionUpdate, disabled }) => {
  // Add default product type if editedProduct.ProductType is undefined
  const defaultProductType = 'hoodie';
  const currentProductType = editedProduct?.ProductType || defaultProductType;

  const handleTypeChange = useCallback((type) => {
    if (!editedProduct || disabled) return;

    const availableColors = getAvailableColorsForProduct(type);
    const newProduct = {
      ...editedProduct, 
      ProductType: type,
      ProductColor: availableColors[0]?.value || 'white',
      ProductView: 'front', // Reset to front view when changing type
      DesignScale: 1, // Reset scale
      DesignPosition: { x: 50, y: 30 } // Reset position to center
    };
    onUpdate(newProduct);
  }, [editedProduct, onUpdate, disabled]);

  const handleColorChange = useCallback((color) => {
    if (!editedProduct || disabled) return;

    onUpdate({
      ...editedProduct, 
      ProductColor: color
    });
  }, [editedProduct, onUpdate, disabled]);

  const handleViewChange = useCallback((view) => {
    if (!editedProduct || disabled) return;

    const newProduct = {
      ...editedProduct,
      ProductView: view,
      DesignPosition: { x: 50, y: 30 } // Reset position when changing view
    };
    onUpdate(newProduct);
  }, [editedProduct, onUpdate, disabled]);

  // Add null checks and default values
  const availableColors = getAvailableColorsForProduct(currentProductType);
  const availableViews = getAvailableViews(currentProductType);
  const productConfig = PRODUCT_TYPES[currentProductType] || DEFAULT_PRODUCT_CONFIG;

  return (
    <div className="space-y-6">
      {/* Product Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          {AVAILABLE_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              disabled={disabled}
              onClick={() => handleTypeChange(type.value)}
              className={`
                px-4 py-3 text-sm font-medium rounded-lg
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                ${currentProductType === type.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
              `}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Color Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <div className="grid grid-cols-4 gap-3">
          {availableColors.map((color) => (
            <button
              key={color.value}
              type="button"
              disabled={disabled}
              onClick={() => handleColorChange(color.value)}
              className={`
                group relative px-4 py-3 text-sm font-medium rounded-lg
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                ${editedProduct?.ProductColor === color.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
              `}
            >
              {color.name}
            </button>
          ))}
        </div>
      </div>

      {/* View Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          View
        </label>
        <div className="grid grid-cols-2 gap-3">
          {availableViews.map((view) => (
            <button
              key={view}
              type="button"
              disabled={disabled}
              onClick={() => handleViewChange(view)}
              className={`
                px-4 py-3 text-sm font-medium rounded-lg
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                ${editedProduct?.ProductView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
              `}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Price Information */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Price Information
        </h4>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Base Price:</span>
            <span className="text-gray-900">
              {productConfig.basePrice.toFixed(2)} EGP
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Production Cost:</span>
            <span className="text-gray-900">
              {productConfig.productionCost.toFixed(2)} EGP
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Design Cost:</span>
            <span className="text-gray-900">
              {productConfig.designCost.toFixed(2)} EGP
            </span>
          </div>
          <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
            <span className="text-gray-500">Recommended Margin:</span>
            <span className="text-gray-900">
              {(productConfig.margins.recommended * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductConfig);