import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { HiX } from 'react-icons/hi';

const ProductConfig = ({ editedProduct, onUpdate, disabled }) => {
  const [newTag, setNewTag] = useState('');

  // Available colors and product types (you can move these to constants)
  const availableColors = [
    { name: 'White', value: 'white' },
    { name: 'Black', value: 'black' },
    { name: 'Navy', value: 'navy' },
    { name: 'Gray', value: 'gray' }
  ];

  const availableTypes = [
    { name: 'T-Shirt', value: 't-shirt' },
    { name: 'Hoodie', value: 'hoodie' },
    { name: 'Long Sleeves', value: 'long-sleeves' }
  ];
  const PRODUCT_TYPES = {
    't-shirt': {
      label: 'T-Shirt',
      basePrice: 295,
      productionCost: 205,
      designCost: 90,
      mockupConfig: {
        version: "v1728393898",
        folder: "t-shirts",
        getFilename: (color, view) => `t-shirt-${color}-${view}`
      }
    },
    'long-sleeve': {
      label: 'Long Sleeve',
      basePrice: 390,
      productionCost: 300,
      designCost: 90,
      mockupConfig: {
        version: "v1728394665",
        folder: "long-sleeves",
        getFilename: (color, view) => `long-sleeve-${color}-${view}`
      }
    },
    'hoodie': {
      label: 'Hoodie',
      basePrice: 490,
      productionCost: 400,
      designCost: 90,
      mockupConfig: {
        version: "v1728392918",
        folder: "hoodies",
        getFilename: (color, view) => `hoodie-${color}-${view}`
      }
    }
  };

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
      [tagField]: [...currentTags, tagToAdd]
    });
    setNewTag('');
  };

  const handleRemoveTag = (type, tagToRemove) => {
    const tagField = type === 'main' ? 'mainTags' : 'Designtags';
    onUpdate({
      [tagField]: (editedProduct[tagField] || []).filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(type);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Product Information */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Product Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type
            </label>
            <select
              value={editedProduct.ProductType}
              onChange={(e) => onUpdate({ ProductType: e.target.value })}
              disabled={disabled}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {availableTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Color
            </label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map(color => (
                <button
                  key={color.value}
                  onClick={() => onUpdate({ ProductColor: color.value })}
                  disabled={disabled}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all
                    ${editedProduct.ProductColor === color.value 
                      ? 'border-blue-500 scale-110' 
                      : 'border-gray-200'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
                  `}
                  style={{ backgroundColor: color.value }}
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
              onChange={(e) => onUpdate({ DesignTitle: e.target.value })}
              disabled={disabled}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
              onChange={(e) => onUpdate({ Description: e.target.value })}
              disabled={disabled}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter product description"
            />
          </div>
        </div>
      </div>

      {/* Tags Management */}
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
            onKeyPress={(e) => handleKeyPress(e, 'main')}
            disabled={disabled}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="ml-2 text-blue-500 hover:text-blue-700"
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
                    className="ml-2 text-green-500 hover:text-green-700"
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
    Designtags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default ProductConfig;