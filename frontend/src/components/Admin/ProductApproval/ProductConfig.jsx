import React, { useCallback } from 'react';
import {
  PRODUCT_TYPES,
  AVAILABLE_TYPES,
  getAvailableColorsForProduct,
  getAvailableViews,
  DEFAULT_PRODUCT_CONFIG,
  validateDesignPosition,
} from "../ProductApproval/constants/productConfig";
import {
  DesignScalingManager,
  DESIGN_CONFIG,
} from "../../../utils/designScaling";

const ProductConfig = ({ editedProduct, onUpdate, onDesignPositionUpdate, disabled }) => {
  const defaultProductType = 'hoodie';
  const currentProductType = editedProduct?.ProductType || defaultProductType;

  const handleTypeChange = useCallback(
    (type) => {
      if (!editedProduct || disabled) return;

      const availableColors = getAvailableColorsForProduct(type);

      // Preserve position when changing product type if possible
      let newPosition;
      if (editedProduct.DesignPosition) {
        // When changing product type, try to maintain relative position
        newPosition = DesignScalingManager.clampPosition(
          editedProduct.DesignPosition,
          type,
          "front"
        );
      } else {
        newPosition = DESIGN_CONFIG.position.default;
      }

      const newProduct = {
        ...editedProduct,
        ProductType: type,
        ProductColor: availableColors[0]?.value || "white",
        ProductView: "front",
        // Preserve scale
        DesignScale: editedProduct.DesignScale || 0.8,
        // Use normalized position
        DesignPosition: newPosition,
      };
      onUpdate(newProduct);
    },
    [editedProduct, onUpdate, disabled]
  );

  const handleColorChange = useCallback(
    (color) => {
      if (!editedProduct || disabled) return;

      // Only update color, preserve all other attributes
      onUpdate({
        ...editedProduct,
        ProductColor: color,
      });
    },
    [editedProduct, onUpdate, disabled]
  );

  const handleViewChange = useCallback(
    (view) => {
      if (!editedProduct || disabled) return;

      // When changing view, translate position appropriately
      let newPosition;
      if (editedProduct.DesignPosition) {
        // Normalize position between views (front/back)
        newPosition = DesignScalingManager.normalizePosition(
          editedProduct.DesignPosition,
          editedProduct.ProductView || "front",
          view,
          editedProduct.ProductType
        );
      } else {
        newPosition = DESIGN_CONFIG.position.default;
      }

      const newProduct = {
        ...editedProduct,
        ProductView: view,
        // Preserve scale
        DesignScale: editedProduct.DesignScale || 0.8,
        // Update position for the new view
        DesignPosition: newPosition,
      };
      onUpdate(newProduct);
    },
    [editedProduct, onUpdate, disabled]
  );

  // Add null checks and default values
  const availableColors = getAvailableColorsForProduct(currentProductType);
  const availableViews = getAvailableViews(currentProductType);
  const productConfig = PRODUCT_TYPES[currentProductType] || DEFAULT_PRODUCT_CONFIG;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
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
      {/* Main Tags */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Main Tags</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {editedProduct.mainTags?.map((tag, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                onClick={() => {
                  const newTags = editedProduct.mainTags.filter((_, i) => i !== index);
                  onUpdate({ mainTags: newTags });
                }}
                className="ml-1.5 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Design Tags</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {editedProduct.Designtags?.map((tag, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
              <button
                onClick={() => {
                  const newTags = editedProduct.Designtags.filter((_, i) => i !== index);
                  onUpdate({ Designtags: newTags });
                }}
                className="ml-1.5 text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </span>
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