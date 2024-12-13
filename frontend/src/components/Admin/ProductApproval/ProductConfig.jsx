import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { HiX } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { 
  AVAILABLE_COLORS, 
  AVAILABLE_TYPES 
} from './constants/productConfig';

const ProductConfig = ({ 
  editedProduct, 
  onUpdate, 
  disabled,
  onDesignPositionUpdate 
}) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (type, tag = newTag) => {
    const tagToAdd = tag.trim().toLowerCase();
    if (!tagToAdd) return;

    const tagField = type === 'main' ? 'mainTags' : 'Designtags';
    const currentTags = editedProduct[tagField] || [];

    if (currentTags.length >= 7) {
      toast.warning(`Maximum 7 ${type} tags allowed`);
      return;
    }

    if (currentTags.includes(tagToAdd)) {
      toast.info('Tag already exists');
      return;
    }

    onUpdate({
      ...editedProduct,
      [tagField]: [...currentTags, tagToAdd]
    });
    setNewTag('');
  };

  const handleRemoveTag = (type, tagToRemove) => {
    const tagField = type === 'main' ? 'mainTags' : 'Designtags';
    onUpdate({
      ...editedProduct,
      [tagField]: (editedProduct[tagField] || []).filter(tag => tag !== tagToRemove)
    });
  };

  const handleProductTypeChange = (type) => {
    // Reset design position when changing product type
    const newProduct = {
      ...editedProduct,
      ProductType: type,
      DesignPosition: { x: 50, y: 30 },
      DesignScale: 0.5
    };
    onUpdate(newProduct);
    if (onDesignPositionUpdate) {
      onDesignPositionUpdate({ x: 50, y: 30 }, 0.5);
    }
  };

  const handleColorChange = (color) => {
    onUpdate({
      ...editedProduct,
      ProductColor: color
    });
  };

  return (
    <div className="space-y-6">
      {/* Product Details Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Product Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type
            </label>
            <select
              value={editedProduct.ProductType}
              onChange={(e) => handleProductTypeChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {AVAILABLE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Color
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  disabled={disabled}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all
                    ${editedProduct.ProductColor === color.value 
                      ? 'border-blue-500 scale-110' 
                      : 'border-gray-200'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
                  `}
                  style={{ 
                    backgroundColor: color.value,
                    boxShadow: color.value === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Design Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Design Title
            </label>
            <input
              type="text"
              value={editedProduct.DesignTitle || ''}
              onChange={(e) => onUpdate({ ...editedProduct, DesignTitle: e.target.value })}
              disabled={disabled}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Enter design title"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editedProduct.Description || ''}
              onChange={(e) => onUpdate({ ...editedProduct, Description: e.target.value })}
              disabled={disabled}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
              placeholder="Enter product description"
            />
          </div>
        </div>
      </div>

      {/* Tags Management Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Tags Management
        </h3>

        {/* Tag Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag('main')}
            disabled={disabled}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Add new tag..."
          />
          <button
            onClick={() => handleAddTag('main')}
            disabled={disabled || !newTag.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Add Main Tag
          </button>
          <button
            onClick={() => handleAddTag('design')}
            disabled={disabled || !newTag.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            Add Design Tag
          </button>
        </div>

        {/* Tags Display */}
        <div className="space-y-4">
          {/* Main Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {(editedProduct.mainTags || []).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag('main', tag)}
                    disabled={disabled}
                    className="ml-2 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Design Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Design Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {(editedProduct.Designtags || []).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag('design', tag)}
                    disabled={disabled}
                    className="ml-2 text-green-500 hover:text-green-700 disabled:opacity-50"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
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
    Designtags: PropTypes.arrayOf(PropTypes.string),
    DesignPosition: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    }),
    DesignScale: PropTypes.number
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  onDesignPositionUpdate: PropTypes.func
};

export default ProductConfig;