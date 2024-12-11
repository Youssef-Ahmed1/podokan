import React from 'react';
import PropTypes from 'prop-types';
import { PRODUCT_TYPES } from './constants/productConfig';

const ProductConfig = ({ editedProduct, onUpdate, disabled }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Product Configuration
      </h3>
      
      <div className="space-y-4">
        {/* Product Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Type
          </label>
          <select
            value={editedProduct.ProductType}
            onChange={(e) => onUpdate({ ProductType: e.target.value })}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {Object.entries(PRODUCT_TYPES).map(([type, config]) => (
              <option key={type} value={type}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        {/* Product Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Colors
          </label>
          <div className="flex flex-wrap gap-2">
            {editedProduct.availableColors.map(color => (
              <button
                key={color}
                onClick={() => onUpdate({ ProductColor: color })}
                disabled={disabled}
                className={`
                  w-8 h-8 rounded-full border-2 transition-all
                  ${editedProduct.ProductColor === color 
                    ? 'border-blue-500 scale-110' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                style={{ backgroundColor: color.toLowerCase() }}
              />
            ))}
          </div>
        </div>

        {/* Design Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Design Title
          </label>
          <input
            type="text"
            value={editedProduct.DesignTitle || ''}
            onChange={(e) => onUpdate({ DesignTitle: e.target.value })}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Enter design title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={editedProduct.Description || ''}
            onChange={(e) => onUpdate({ Description: e.target.value })}
            disabled={disabled}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Enter product description"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {editedProduct.mainTags?.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
              >
                {tag}
                <button
                  onClick={() => onUpdate({
                    mainTags: editedProduct.mainTags.filter(t => t !== tag)
                  })}
                  disabled={disabled}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

ProductConfig.propTypes = {
  editedProduct: PropTypes.shape({
    ProductType: PropTypes.string.isRequired,
    ProductColor: PropTypes.string.isRequired,
    DesignTitle: PropTypes.string,
    Description: PropTypes.string,
    mainTags: PropTypes.arrayOf(PropTypes.string),
    availableColors: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default ProductConfig;