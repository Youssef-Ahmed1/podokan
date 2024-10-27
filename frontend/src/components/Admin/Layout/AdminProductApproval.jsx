import React, { useEffect, useState, useCallback, useMemo ,useRef} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  AiOutlineWarning, 
  AiOutlineCheckCircle,
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineEye,
  AiOutlineSearch,
  AiOutlineFilter,
    AiOutlineTags, 
  AiOutlineShop, 
  
} from 'react-icons/ai';
import { BiGrid, BiRuler } from 'react-icons/bi';
import { BsZoomIn, BsZoomOut } from 'react-icons/bs';
import { fetchPendingProducts, approveRejectProduct } from '../../../redux/actions/product';
import {  loadUser } from '../../../redux/actions/user';
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom';;

// Sub-components go here, before the main component
const ProductCard = ({ product, onSelect, viewMode }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Product Image */}
        <div className="relative aspect-square">
          <img
            src={product.designImage?.url || product.designImage}
            alt={product.DesignTitle}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-image.png'; // Add your placeholder image
            }}
          />
          <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
          </span>
        </div>

        {/* Product Details */}
        <div className="p-4">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {product.DesignTitle}
            </h3>
            <p className="text-sm text-gray-500 flex items-center">
              <AiOutlineShop className="mr-1" />
              {product.shop?.name || 'Unknown Shop'}
            </p>
          </div>

          <div className="mb-3">
            <div className="flex items-center text-sm text-gray-500">
              <AiOutlineTags className="mr-1" />
              <span className="font-medium">{product.Maintag}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {product.Description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(product.originalPrice)}
              </p>
              {product.discountPrice && (
                <p className="text-sm text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </p>
              )}
            </div>
            <button
              onClick={() => onSelect(product)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
            >
              Review
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Created {formatDate(product.createdAt)}</span>
              <span>{product.ProductType}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="w-24 h-24 flex-shrink-0">
          <img
            src={product.designImage?.url || product.designImage}
            alt={product.DesignTitle}
            className="w-full h-full object-contain rounded-md"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-image.png';
            }}
          />
        </div>

        {/* Product Details */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {product.DesignTitle}
              </h3>
              <p className="text-sm text-gray-500 flex items-center">
                <AiOutlineShop className="mr-1" />
                {product.shop?.name || 'Unknown Shop'}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center text-sm text-gray-500">
                <AiOutlineTags className="mr-1" />
                <span className="font-medium">{product.Maintag}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {product.Designtags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                    {tag}
                  </span>
                ))}
                {product.Designtags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                    +{product.Designtags.length - 3}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(product.originalPrice)}
              </p>
              {product.discountPrice && (
                <p className="text-sm text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{formatDate(product.createdAt)}</span>
              <span>{product.ProductType}</span>
            </div>
            <button
              onClick={() => onSelect(product)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
            >
              Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    DesignTitle: PropTypes.string.isRequired,
    Description: PropTypes.string.isRequired,
    Maintag: PropTypes.string.isRequired,
    Designtags: PropTypes.arrayOf(PropTypes.string).isRequired,
    ProductType: PropTypes.oneOf(VALID_PRODUCT_TYPES).isRequired,
    status: PropTypes.string.isRequired,
    originalPrice: PropTypes.number.isRequired,
    discountPrice: PropTypes.number,
    designImage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        url: PropTypes.string.isRequired
      })
    ]).isRequired,
    createdAt: PropTypes.string.isRequired,
    shop: PropTypes.shape({
      name: PropTypes.string
    })
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  viewMode: PropTypes.oneOf(['list', 'grid']).isRequired
};
const ProductEditView = ({
  product,
  onMetadataChange,
  onApprove,
  onReject,
  onCancel,
  validationErrors,
  isValidating,
  
}) => {
  const [activeTab, setActiveTab] = useState('metadata');
  const [designView, setDesignView] = useState('front');
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  
  // Tag management
  const [tagInput, setTagInput] = useState('');
  
  const handleAddTag = useCallback(() => {
    const newTag = tagInput.trim();
    if (newTag && product.Designtags.length < 7) {
      if (!product.Designtags.includes(newTag)) {
        onMetadataChange('Designtags', [...product.Designtags, newTag]);
      }
      setTagInput('');
    }
  }, [tagInput, product.Designtags, onMetadataChange]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    onMetadataChange('Designtags', 
      product.Designtags.filter(tag => tag !== tagToRemove)
    );
  }, [product.Designtags, onMetadataChange]);

  // Price calculations
  const calculatePricing = useCallback(() => {
    const config = PRODUCT_CONFIG[product.ProductType];
    const basePrice = config.basePrice;
    const originalPrice = product.originalPrice || basePrice;
    const discountPrice = product.discountPrice;

    const profit = originalPrice - basePrice;
    const profitMargin = ((profit / originalPrice) * 100).toFixed(1);
    
    let discountProfit = 0;
    let discountMargin = 0;
    if (discountPrice) {
      discountProfit = discountPrice - basePrice;
      discountMargin = ((discountProfit / discountPrice) * 100).toFixed(1);
    }

    return {
      basePrice,
      profit,
      profitMargin,
      discountProfit,
      discountMargin,
      minPrice: config.minPrice
    };
  }, [product.ProductType, product.originalPrice, product.discountPrice]);

  const pricing = useMemo(() => calculatePricing(), [calculatePricing]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'metadata'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('metadata')}
          >
            Metadata
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'preview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'metadata' ? (
          <div className="space-y-6">
            {/* Title and Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Design Title
                </label>
                <input
                  type="text"
                  value={product.DesignTitle}
                  onChange={(e) => onMetadataChange('DesignTitle', e.target.value)}
                  className={`mt-1 block w-full rounded-md border ${
                    validationErrors.DesignTitle 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } shadow-sm px-4 py-2`}
                  disabled={isValidating}
                />
                {validationErrors.DesignTitle && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.DesignTitle}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={product.Description}
                  onChange={(e) => onMetadataChange('Description', e.target.value)}
                  rows={4}
                  className={`mt-1 block w-full rounded-md border ${
                    validationErrors.Description 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } shadow-sm px-4 py-2`}
                  disabled={isValidating}
                />
                {validationErrors.Description && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.Description}
                  </p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Main Tag
                </label>
                <select
                  value={product.Maintag}
                  onChange={(e) => onMetadataChange('Maintag', e.target.value)}
                  className={`mt-1 block w-full rounded-md border ${
                    validationErrors.Maintag 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } shadow-sm px-4 py-2`}
                  disabled={isValidating}
                >
                  <option value="">Select main tag</option>
                  {MAIN_TAG_CATEGORIES.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                {validationErrors.Maintag && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.Maintag}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Design Tags ({product.Designtags.length}/7)
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.Designtags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-500"
                        disabled={isValidating}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add a tag..."
                    className="block w-full rounded-l-md border border-gray-300 shadow-sm px-4 py-2"
                    disabled={isValidating || product.Designtags.length >= 7}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 disabled:opacity-50"
                    disabled={isValidating || product.Designtags.length >= 7 || !tagInput.trim()}
                  >
                    Add
                  </button>
                </div>
                {validationErrors.Designtags && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.Designtags}
                  </p>
                )}
              </div>
            </div>

            {/* Product Configuration */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Type
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {VALID_PRODUCT_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onMetadataChange('ProductType', type)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          product.ProductType === type
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isValidating}
                      >
                        {PRODUCT_CONFIG[type].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Available Colors
                  </label>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {VALID_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          const colors = product.availableColors || [];
                          const newColors = colors.includes(color)
                            ? colors.filter(c => c !== color)
                            : [...colors, color];
                          onMetadataChange('availableColors', newColors);
                        }}
                        className={`w-8 h-8 rounded-full border-2 ${
                          (product.availableColors || []).includes(color)
                            ? 'border-blue-500'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: COLOR_OPTIONS[color].hex }}
                        disabled={isValidating}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Pricing
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {showAdvancedPricing ? 'Hide' : 'Show'} Advanced
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Original Price (£)
                  </label>
                  <input
                    type="number"
                    value={product.originalPrice || ''}
                    onChange={(e) => onMetadataChange('originalPrice', parseFloat(e.target.value))}
                    min={pricing.minPrice}
                    step="0.01"
                    className={`mt-1 block w-full rounded-md border ${
                      validationErrors.originalPrice 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } shadow-sm px-4 py-2`}
                    disabled={isValidating}
                  />
                  {validationErrors.originalPrice && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.originalPrice}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount Price (£)
                  </label>
                  <input
                    type="number"
                    value={product.discountPrice || ''}
                    onChange={(e) => onMetadataChange('discountPrice', parseFloat(e.target.value))}
                    min={pricing.minPrice}
                    max={product.originalPrice}
                    step="0.01"
                    className={`mt-1 block w-full rounded-md border ${
                      validationErrors.discountPrice 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } shadow-sm px-4 py-2`}
                    disabled={isValidating || !product.originalPrice}
                  />
                  {validationErrors.discountPrice && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.discountPrice}
                    </p>
                  )}
                </div>
              </div>

              {showAdvancedPricing && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Base Price:</span>
                      <span className="ml-2 font-medium">£{pricing.basePrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Profit:</span>
                      <span className="ml-2 font-medium">£{pricing.profit.toFixed(2)} ({pricing.profitMargin}%)</span>
                    </div>
                    {product.discountPrice && (
                      <>
                        <div>
                          <span className="text-gray-500">Discount Profit:</span>
                          <span className="ml-2 font-medium">
                            £{pricing.discountProfit.toFixed(2)} ({pricing.discountMargin}%)
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Discount Amount:</span>
                          <span className="ml-2 font-medium">
                            {(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100).toFixed(1)}% OFF
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Preview Tab
          <ProductPreview
            product={product}
            currentView={designView}
            onViewChange={setDesignView}
            disabled={isValidating}
          />
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-50 px-6 py-4 flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          disabled={isValidating}
        >
          Cancel
        </button>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onReject}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-500"
            disabled={isValidating}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50"
            disabled={isValidating || Object.keys(validationErrors).length > 0}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

ProductEditView.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    DesignTitle: PropTypes.string.isRequired,
    Description: PropTypes.string.isRequired,
    Maintag: PropTypes.string.isRequired,
    Designtags: PropTypes.arrayOf(PropTypes.string).isRequired,
    ProductType: PropTypes.oneOf(VALID_PRODUCT_TYPES).isRequired,
    ProductColor: PropTypes.oneOf(VALID_COLORS).isRequired,
    originalPrice: PropTypes.number,
    discountPrice: PropTypes.number,
    availableColors: PropTypes.arrayOf(PropTypes.oneOf(VALID_COLORS)),
    DesignPosition: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired,
    DesignScale: PropTypes.number.isRequired
  }).isRequired,
  onMetadataChange: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  validationErrors: PropTypes.object.isRequired,
  isValidating: PropTypes.bool.isRequired
};

const ProductPreview = ({
  product,
  currentView,
  onViewChange,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(product.DesignPosition);
  const [scale, setScale] = useState(product.DesignScale);
  const [showGrid, setShowGrid] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const designRef = useRef(null);

  // Get product configuration
  const productConfig = PRODUCT_CONFIG[product.ProductType];
  const designArea = productConfig.designArea;

  // Update position and scale when product changes
  useEffect(() => {
    setPosition(product.DesignPosition);
    setScale(product.DesignScale);
  }, [product]);

  // Handle design drag
  const handleDragStart = useCallback((e) => {
    if (disabled) return;

    e.preventDefault();
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  }, [disabled]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || disabled) return;

    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    const deltaX = ((clientX - dragStart.x) / container.width) * 100;
    const deltaY = ((clientY - dragStart.y) / container.height) * 100;

    setDragStart({ x: clientX, y: clientY });
    setPosition(prev => {
      const newX = Math.max(0, Math.min(100, prev.x + deltaX));
      const newY = Math.max(0, Math.min(100, prev.y + deltaY));
      return { x: newX, y: newY };
    });
  }, [isDragging, dragStart, disabled]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  // Handle zoom/scale
  const handleZoom = useCallback((delta) => {
    if (disabled) return;

    setScale(prev => {
      const newScale = Math.max(0.5, Math.min(2, prev + delta));
      return newScale;
    });
  }, [disabled]);

  const handleWheel = useCallback((e) => {
    if (disabled || !e.ctrlKey) return;
    
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    handleZoom(delta);
  }, [disabled, handleZoom]);

  // Center design
  const handleCenter = useCallback((axis) => {
    if (disabled) return;

    setPosition(prev => ({
      ...prev,
      [axis]: 50
    }));
  }, [disabled]);

  // Handle image loading
  const handleImageLoad = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setError('Failed to load design image');
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Calculate clip path for design boundaries
  const getClipPath = useCallback(() => {
    if (!containerRef.current || !designRef.current) return '';

    const container = containerRef.current.getBoundingClientRect();
    const design = designRef.current.getBoundingClientRect();
    
    const designWidth = design.width * scale;
    const designHeight = design.height * scale;
    
    const leftClip = Math.max(0, (designWidth / 2) - (position.x * container.width / 100));
    const rightClip = Math.max(0, (designWidth / 2) + (position.x * container.width / 100) - container.width);
    const topClip = Math.max(0, (designHeight / 2) - (position.y * container.height / 100));
    const bottomClip = Math.max(0, (designHeight / 2) + (position.y * container.height / 100) - container.height);

    return `inset(${topClip}px ${rightClip}px ${bottomClip}px ${leftClip}px)`;
  }, [position, scale]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Controls Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['front', 'back'].map((view) => (
                <button
                  key={view}
                  onClick={() => onViewChange(view)}
                  disabled={disabled}
                  className={`
                    px-3 py-1 rounded-md text-sm font-medium transition-all
                    ${currentView === view 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>

            {/* Grid and Guides Toggles */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              disabled={disabled}
              className={`p-2 rounded-lg transition-colors ${
                showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Toggle Grid"
            >
              <BiGrid size={20} />
            </button>
            <button
              onClick={() => setShowGuides(!showGuides)}
              disabled={disabled}
              className={`p-2 rounded-lg transition-colors ${
                showGuides ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Toggle Guides"
            >
              <BiRuler size={20} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleZoom(-0.1)}
              disabled={disabled || scale <= 0.5}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              title="Zoom Out"
            >
              <BsZoomOut size={20} />
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {(scale * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => handleZoom(0.1)}
              disabled={disabled || scale >= 2}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              title="Zoom In"
            >
              <BsZoomIn size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div 
        ref={containerRef}
        className="relative aspect-square w-full bg-gray-50"
        onWheel={handleWheel}
      >
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center text-red-500">
              <AiOutlineWarning size={32} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Grid */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-blue-200 opacity-30" />
              ))}
            </div>
          </div>
        )}

        {/* Center Guides */}
        {showGuides && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-blue-400 opacity-50" />
            <div className="absolute top-1/2 left-0 right-0 border-t border-blue-400 opacity-50" />
          </div>
        )}

        {/* Design */}
        <div
          ref={designRef}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            width: `${designArea.width}px`,
            height: `${designArea.height}px`,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            clipPath: getClipPath()
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <img
            src={product.designImage?.url || product.designImage}
            alt="Design Preview"
            className="w-full h-full object-contain"
            draggable={false}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>

        {/* Position Indicators */}
        <div className="absolute bottom-4 right-4 bg-black/75 text-white px-3 py-1 rounded-full text-sm">
          X: {position.x.toFixed(1)}% Y: {position.y.toFixed(1)}%
        </div>
      </div>

      {/* Centering Controls */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => handleCenter('x')}
            disabled={disabled}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Center Horizontally
          </button>
          <button
            onClick={() => handleCenter('y')}
            disabled={disabled}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Center Vertically
          </button>
        </div>
      </div>
    </div>
  );
};

ProductPreview.propTypes = {
  product: PropTypes.shape({
    designImage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        url: PropTypes.string.isRequired
      })
    ]).isRequired,
    ProductType: PropTypes.oneOf(VALID_PRODUCT_TYPES).isRequired,
    DesignPosition: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired,
    DesignScale: PropTypes.number.isRequired
  }).isRequired,
  currentView: PropTypes.oneOf(['front', 'back']).isRequired,
  onViewChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ProductPreview.displayName = 'ProductPreview';
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  maxDisplayedPages = 5 
}) => {
  const getPageNumbers = useCallback(() => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
    let endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);

    // Adjust startPage if endPage is maxed out
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxDisplayedPages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, maxDisplayedPages]);

  // Don't render if there's only one page
  if (totalPages <= 1) return null;

  const pages = getPageNumbers();

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-6">
      {/* Mobile View */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium
            ${currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
        >
          Previous
        </button>
        <span className="text-sm text-gray-700 px-4 py-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium
            ${currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
        >
          Next
        </button>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium
                ${currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
                } border border-gray-300`}
            >
              <span className="sr-only">Previous</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Page Numbers */}
            {pages.map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...' || page === currentPage}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300
                  ${page === currentPage
                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                    : page === '...'
                      ? 'cursor-default bg-white text-gray-700'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
              >
                {page}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium
                ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
                } border border-gray-300`}
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </nav>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  maxDisplayedPages: PropTypes.number
};

Pagination.displayName = 'Pagination';


const VALID_PRODUCT_TYPES = ['t-shirt', 'hoodie', 'long-sleeve'];
const VALID_COLORS = ['white', 'black', 'red', 'blue', 'gray'];
const MAIN_TAG_CATEGORIES = [
  'Funny', 'Anime', 'Sci-fi', 'Movies', 'Vintage',
  'Music', 'Television', 'Sports', 'Custom'
];

const PRODUCT_CONFIG = {
  't-shirt': {
    basePrice: 295,
    minPrice: 295,
    designCost: 90,
    label: 'T-Shirt',
    designArea: { width: 300, height: 400 },
    currency: 'EGP'  
  },
  'hoodie': {
    basePrice: 490,
    minPrice: 490,
    designCost: 90,
    label: 'Hoodie',
    designArea: { width: 280, height: 380 },
    currency: 'EGP'
  },
  'long-sleeve': {
    basePrice: 390,
    minPrice: 390,
    designCost: 90,
    label: 'Long Sleeve',
    designArea: { width: 300, height: 400 },
    currency: 'EGP'
  }
  
};
const COLOR_OPTIONS = {
  white: {
    value: 'white',
    label: 'White',
    hex: '#ffffff',
    textColor: 'text-gray-800',
    mockupModifier: 'none',
    designBlendMode: 'multiply',
    borderPreview: 'border-gray-200',
    background: 'bg-white',
    hoverBg: 'hover:bg-gray-50',
    selectedBg: 'bg-gray-100'
  },
  black: {
    value: 'black',
    label: 'Black',
    hex: '#000000',
    textColor: 'text-white',
    mockupModifier: 'none',
    designBlendMode: 'screen',
    borderPreview: 'border-gray-800',
    background: 'bg-black',
    hoverBg: 'hover:bg-gray-900',
    selectedBg: 'bg-gray-800'
  },
  red: {
    value: 'red',
    label: 'Red',
    hex: '#ef4444',
    textColor: 'text-white',
    mockupModifier: 'none',
    designBlendMode: 'multiply',
    borderPreview: 'border-red-500',
    background: 'bg-red-500',
    hoverBg: 'hover:bg-red-600',
    selectedBg: 'bg-red-700'
  },
  blue: {
    value: 'blue',
    label: 'Blue',
    hex: '#3b82f6',
    textColor: 'text-white',
    mockupModifier: 'none',
    designBlendMode: 'multiply',
    borderPreview: 'border-blue-500',
    background: 'bg-blue-500',
    hoverBg: 'hover:bg-blue-600',
    selectedBg: 'bg-blue-700'
  },
  gray: {
    value: 'gray',
    label: 'Gray',
    hex: '#6b7280',
    textColor: 'text-white',
    mockupModifier: 'none',
    designBlendMode: 'multiply',
    borderPreview: 'border-gray-500',
    background: 'bg-gray-500',
    hoverBg: 'hover:bg-gray-600',
    selectedBg: 'bg-gray-700'
  }
};

// Also add this validation helper for color options
const isValidColor = (color) => {
  return Object.keys(COLOR_OPTIONS).includes(color);
};

// Add this price formatting helper
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'egp',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price || 0);
};

// Add this color utilities object
const ColorUtils = {
  getContrastText: (color) => {
    return COLOR_OPTIONS[color]?.textColor || 'text-gray-800';
  },
  getBackgroundClass: (color) => {
    return COLOR_OPTIONS[color]?.background || 'bg-white';
  },
  getHoverClass: (color) => {
    return COLOR_OPTIONS[color]?.hoverBg || 'hover:bg-gray-50';
  },
  getSelectedClass: (color) => {
    return COLOR_OPTIONS[color]?.selectedBg || 'bg-gray-100';
  },
  getBorderPreviewClass: (color) => {
    return COLOR_OPTIONS[color]?.borderPreview || 'border-gray-200';
  },
  getDesignBlendMode: (color) => {
    return COLOR_OPTIONS[color]?.designBlendMode || 'multiply';
  }
};

// Add type checking for colors in PropTypes
const colorPropType = PropTypes.oneOf(Object.keys(COLOR_OPTIONS));


const AdminProductApproval = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();  
  const { 
    pendingProducts, 
    isLoading: productLoading, 
    error: productError,
    filters,
    pagination 
  } = useSelector(state => state.product);
  
  const { 
    isAuthenticated, 
    user, 
    loading: userLoading,
    error: userError 
  } = useSelector((state) => state.user);
  
  const {
    seller,
    isLoading: sellerLoading,
    error: sellerError
  } = useSelector((state) => state.seller);
  
  // Local state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Product editing state
  const [editedProduct, setEditedProduct] = useState({
    DesignTitle: '',
    Description: '',
    Maintag: '',
    Designtags: [],
    ProductType: 't-shirt',
    ProductColor: 'white',
    originalPrice: 0,
    discountPrice: null,
    DesignPosition: { x: 50, y: 50 },
    DesignScale: 1,
    ProductView: 'front'
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isAuthenticated) {
          await dispatch(loadUser()).unwrap();
        }
      } catch (error) {
        toast.error('Authentication failed. Please login again.');
        navigate('/login', { 
          state: { from: '/admin-approval' } 
        });
      }
    };
  
    checkAuth();
  }, [dispatch, isAuthenticated, navigate]);
  // Check admin authorization
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'Admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);
  useEffect(() => {
    const loadProducts = async () => {
      if (isAuthenticated && user?.role === 'Admin') {
        try {
          await dispatch(fetchPendingProducts()).unwrap();
        } catch (error) {
          toast.error(error.message || 'Failed to load products');
        }
      }
    };

    loadProducts();
  }, [dispatch, isAuthenticated, user]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return pendingProducts
      .filter(product => {
        const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
        const matchesSearch = !searchTerm || [
          product.DesignTitle,
          product.Description,
          product.Maintag,
          ...(product.Designtags || [])
        ].some(field => 
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'priceHigh':
            return (b.originalPrice || 0) - (a.originalPrice || 0);
          case 'priceLow':
            return (a.originalPrice || 0) - (b.originalPrice || 0);
          case 'newest':
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
  }, [pendingProducts, filterStatus, searchTerm, sortBy]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Handle product selection
  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setEditedProduct({
      ...product,
      DesignPosition: product.DesignPosition || { x: 50, y: 50 },
      DesignScale: product.DesignScale || 1,
      ProductView: product.ProductView || 'front',
      Designtags: product.Designtags || []
    });
    setEditMode(true);
    setValidationErrors({});
  }, []);

  // Handle metadata changes
  const handleMetadataChange = useCallback((field, value) => {
    setEditedProduct(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear validation error for the field
    setValidationErrors(prev => ({
      ...prev,
      [field]: null
    }));
  }, []);

  // Validation
  const validateProduct = useCallback(() => {
    const errors = {};

    // Title validation
    if (!editedProduct.DesignTitle?.trim()) {
      errors.DesignTitle = 'Title is required';
    } else if (editedProduct.DesignTitle.length < 3) {
      errors.DesignTitle = 'Title must be at least 3 characters';
    }

    // Description validation
    if (!editedProduct.Description?.trim()) {
      errors.Description = 'Description is required';
    } else if (editedProduct.Description.length < 10) {
      errors.Description = 'Description must be at least 10 characters';
    }

    // Main tag validation
    if (!editedProduct.Maintag) {
      errors.Maintag = 'Main tag is required';
    } else if (!MAIN_TAG_CATEGORIES.includes(editedProduct.Maintag)) {
      errors.Maintag = 'Invalid main tag category';
    }

    // Design tags validation
    if (!editedProduct.Designtags?.length) {
      errors.Designtags = 'At least one design tag is required';
    } else if (editedProduct.Designtags.length > 7) {
      errors.Designtags = 'Maximum 7 tags allowed';
    }

    // Price validation
    const minPrice = PRODUCT_CONFIG[editedProduct.ProductType].minPrice;
    if (!editedProduct.originalPrice || editedProduct.originalPrice < minPrice) {
      errors.originalPrice = `Minimum price is ${formatPrice(minPrice)}`;
        }
    if (editedProduct.discountPrice && editedProduct.discountPrice > editedProduct.originalPrice) {
      errors.discountPrice = 'Discount price cannot be higher than original price';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editedProduct]);

  // Handle approve/reject
  const handleApprove = useCallback(async (product) => {
    try {
      await dispatch(approveRejectProduct({
        productId: product._id,
        status: 'public',
        updates: {
          visibility: 'public',
          originalPrice: product.originalPrice,
          discountPrice: product.discountPrice,
          availableColors: product.availableColors
        }
      })).unwrap();

      toast.success('Product approved successfully');
      setSelectedProduct(null);
      setEditMode(false);
    } catch (error) {
      toast.error(error.message || 'Failed to approve product');
    }
  }, [dispatch]);


  const handleReject = useCallback(async (product) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason?.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await dispatch(approveRejectProduct({
        productId: product._id,
        status: 'rejected',
        statusReason: reason,
        updates: { visibility: 'restricted' }
      })).unwrap();

      toast.success('Product rejected successfully');
      setSelectedProduct(null);
      setEditMode(false);
    } catch (error) {
      toast.error(error.message || 'Failed to reject product');
    }
  }, [dispatch]);


  // Render loading state
  if  (userLoading || productLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }{
        return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Error state
  const displayError = productError || userError 

  if (displayError && !editMode) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-red-50 p-4 rounded-lg text-red-700">
          <AiOutlineWarning className="inline-block mr-2" />
          {displayError}
        </div>
      </div>
    );
  }  
  if (displayError && !editMode) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-red-50 p-4 rounded-lg text-red-700">
          <AiOutlineWarning className="inline-block mr-2" />
          {displayError}
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Product Approval Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredProducts.length} products pending review
          </p>
        </div>

        {editMode && selectedProduct ? (
          // Product Edit View
          <ProductEditView
            product={editedProduct}
            onMetadataChange={handleMetadataChange}
            onApprove={handleApprove}
            onReject={handleReject}
            onCancel={() => {
              setEditMode(false);
              setSelectedProduct(null);
              setEditedProduct(null);
            }}
            validationErrors={validationErrors}
            isValidating={isValidating}
          />
        ) : (
          // Product List View
          <>
            {/* Filters and Search */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <AiOutlineSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Only</option>
                <option value="public">Approved Only</option>
                <option value="rejected">Rejected Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="priceLow">Price: Low to High</option>
              </select>

              <div className="flex justify-end">
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {viewMode === 'list' ? 'Grid View' : 'List View'}
                </button>
              </div>
            </div>

            {/* Product List */}
            {paginatedProducts.length === 0 ? (
              <div className="text-center py-12">
                <AiOutlineWarning className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'No products pending approval'}
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              }`}>
                {paginatedProducts.map(product => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onSelect={handleProductSelect}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProductApproval;