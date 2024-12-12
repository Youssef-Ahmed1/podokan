import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { HiX } from 'react-icons/hi';
import { 
  PRODUCT_TYPES, 
  AVAILABLE_COLORS, 
  AVAILABLE_TYPES,
  CLOUDINARY_BASE 
} from './constants/productConfig';

const ProductConfig = ({ editedProduct, onUpdate, disabled, designImageUrl }) => {
  const [newTag, setNewTag] = useState('');
  const [selectedView, setSelectedView] = useState('front');
  const [mockupUrl, setMockupUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    updateMockupUrl();
  }, [editedProduct.ProductType, editedProduct.ProductColor, selectedView]);

  const updateMockupUrl = () => {
    if (!editedProduct.ProductType || !editedProduct.ProductColor) {
      setMockupUrl('');
      return;
    }

    const productConfig = PRODUCT_TYPES[editedProduct.ProductType];
    if (!productConfig) {
      setMockupUrl('');
      return;
    }

    const { mockupConfig } = productConfig;
    const filename = mockupConfig.getFilename(editedProduct.ProductColor, selectedView);
    const url = `${CLOUDINARY_BASE}/${mockupConfig.version}/${mockupConfig.folder}/${filename}.png`;
    setMockupUrl(url);
  };

  // Preview Components
  const renderDesignPreview = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Design Preview
      </h3>
      <div className="flex justify-center">
        <div className="relative w-full max-w-md aspect-square">
          {designImageUrl ? (
            <img
              src={designImageUrl}
              alt="Design Preview"
              className="w-full h-full object-contain"
              onError={() => toast.error('Failed to load design preview')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              No design uploaded
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMockupPreview = () => {
    if (!editedProduct.ProductType || !editedProduct.ProductColor) {
      return (
        <div className="text-center text-gray-500 p-4">
          Select a product type and color to view mockup
        </div>
      );
    }

    return (
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Product Preview
        </h4>
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-md aspect-square mb-4">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              </div>
            )}
            {mockupUrl && (
              <img
                src={mockupUrl}
                alt={`${editedProduct.ProductType} ${selectedView} view`}
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  isLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onError={() => {
                  setIsLoading(false);
                  toast.error('Failed to load product mockup');
                }}
                onLoad={() => setIsLoading(false)}
              />
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('front')}
              className={`px-4 py-2 rounded-lg ${
                selectedView === 'front'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Front View
            </button>
            <button
              onClick={() => setSelectedView('back')}
              className={`px-4 py-2 rounded-lg ${
                selectedView === 'back'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Back View
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Tag Management Functions
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
      {/* Design Preview Section */}
      {renderDesignPreview()}

      {/* Product Configuration Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Product Configuration
        </h3>

        {renderMockupPreview()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Type Selection */}
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
  disabled: PropTypes.bool,
  designImageUrl: PropTypes.string
};

export default ProductConfig;