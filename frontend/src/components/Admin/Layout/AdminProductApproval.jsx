import React, { useEffect, useState, memo, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  AiOutlineCloudUpload, 
  AiOutlineDelete, 
  AiOutlineInfoCircle,
  AiOutlineWarning,
  AiOutlineCheckCircle
} from 'react-icons/ai';
import { BiRuler } from 'react-icons/bi';
import { BsZoomIn, BsZoomOut } from 'react-icons/bs';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import { fetchPendingProducts, approveRejectProduct } from '../../../redux/actions/productActions';
import styles from '../../../styles/styles';

// Constants
const VALID_COLORS = ['white', 'black', 'red', 'blue', 'gray'];
const VALID_PRODUCT_TYPES = ['t-shirt', 'hoodie', 'long-sleeve'];
const VALID_VIEWS = ['front', 'back'];
const VALID_STATUSES = ['pending', 'public', 'rejected'];
const VALID_VISIBILITY = ['restricted', 'public'];

const MAIN_TAG_CATEGORIES = [
  'Funny',
  'Anime',
  'Sci-fi',
  'Movies',
  'Vintage',
  'Music',
  'Television',
  'Sports',
  'Custom'
];

const PRODUCT_TYPES = {
  't-shirt': {
    label: 'T-Shirt',
    basePrice: 295,
    minPrice: 295,
    designCost: 90,
    mockupConfig: {
      folder: 't-shirts',
      designArea: {
        front: { width: 300, height: 400, top: '25%', left: '50%' },
        back: { width: 300, height: 400, top: '25%', left: '50%' }
      },
      defaultScale: 1,
      minScale: 0.5,
      maxScale: 2
    }
  },
  'hoodie': {
    label: 'Hoodie',
    basePrice: 490,
    minPrice: 490,
    designCost: 90,
    mockupConfig: {
      folder: 'hoodies',
      designArea: {
        front: { width: 280, height: 380, top: '30%', left: '50%' },
        back: { width: 300, height: 400, top: '25%', left: '50%' }
      },
      defaultScale: 1,
      minScale: 0.5,
      maxScale: 2
    }
  },
  'long-sleeve': {
    label: 'Long Sleeve',
    basePrice: 390,
    minPrice: 390,
    designCost: 90,
    mockupConfig: {
      folder: 'long-sleeves',
      designArea: {
        front: { width: 300, height: 400, top: '25%', left: '50%' },
        back: { width: 300, height: 400, top: '25%', left: '50%' }
      },
      defaultScale: 1,
      minScale: 0.5,
      maxScale: 2
    }
  }
};const COLOR_OPTIONS = {
  white: {
    value: 'white',
    label: 'White',
    hex: '#ffffff',
    textColor: 'text-gray-800',
    mockupModifier: 'none',
    designBlendMode: 'multiply'
  },
  black: {
    value: 'black',
    label: 'Black',
    hex: '#000000',
    textColor: 'text-white',
    mockupModifier: 'none',
    designBlendMode: 'screen'
  },
  red: {
    value: 'red',
    label: 'Red',
    hex: '#ff0000',
    textColor: 'text-white',
    mockupModifier: 'none',
    designBlendMode: 'multiply'
  },
  blue: {
    value: 'blue',
    label: 'Blue',
    hex: '#0000ff',
    textColor: 'text-white',
    mockupModifier: 'none',
    designBlendMode: 'multiply'
  },
  gray: {
    value: 'gray',
    label: 'Gray',
    hex: '#808080',
    textColor: 'text-white',
    mockupModifier: 'none',
    designBlendMode: 'multiply'
  }
};

const STATUS_CONFIG = {
  pending: {
    value: 'pending',
    label: 'Pending Review',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-800',
    icon: AiOutlineWarning,
    description: 'Awaiting admin review'
  },
  public: {
    value: 'public',
    label: 'Public',
    color: 'bg-green-500',
    textColor: 'text-green-800',
    icon: AiOutlineCheckCircle,
    description: 'Available for purchase'
  },
  rejected: {
    value: 'rejected',
    label: 'Rejected',
    color: 'bg-red-500',
    textColor: 'text-red-800',
    icon: AiOutlineWarning,
    description: 'Not approved for sale'
  }
};// Utility Functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }const ValidationSystem = memo(({ 
  product, 
  onValidationChange,
  disabled = false 
}) => {
  const [validationResults, setValidationResults] = useState({
    title: { isValid: true },
    description: { isValid: true },
    price: { isValid: true },
    mainTag: { isValid: true },
    tags: { isValid: true },
    designPosition: { isValid: true },
    designScale: { isValid: true }
  });

  const validateAll = useCallback(() => {
    const results = {
      title: ValidationUtils.validateTitle(product.DesignTitle),
      description: ValidationUtils.validateDescription(product.Description),
      price: ValidationUtils.validatePrice(product.originalPrice, product.ProductType),
      mainTag: ValidationUtils.validateMainTag(product.Maintag),
      tags: ValidationUtils.validateTags(product.Designtags),
      designPosition: ValidationUtils.validateDesignPosition(
        product.DesignPosition, 
        product.ProductType,
        product.ProductView
      ),
      designScale: ValidationUtils.validateDesignScale(
        product.DesignScale,
        product.ProductType
      )
    };

    setValidationResults(results);

    const isValid = Object.values(results).every(result => result.isValid);
    const errors = Object.entries(results)
      .filter(([_, result]) => !result.isValid)
      .map(([field, result]) => ({
        field,
        error: result.error
      }));

    onValidationChange(isValid, errors);
    return isValid;
  }, [
    product.DesignTitle,
    product.Description,
    product.originalPrice,
    product.ProductType,
    product.Maintag,
    product.Designtags,
    product.DesignPosition,
    product.DesignScale,
    product.ProductView,
    onValidationChange
  ]);

  useEffect(() => {
    if (!disabled) {
      validateAll();
    }
  }, [disabled, validateAll]);

  const getValidationIcon = useCallback((result) => {
    if (!result) return null;
    return result.isValid ? (
      <AiOutlineCheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AiOutlineWarning className="w-5 h-5 text-red-500" />
    );
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Validation Status
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Title Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Design Title</h4>
            {!validationResults.title.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.title.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.title)}
        </div>

        {/* Description Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Description</h4>
            {!validationResults.description.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.description.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.description)}
        </div>

        {/* Price Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Price</h4>
            {!validationResults.price.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.price.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.price)}
        </div>

        {/* Main Tag Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Main Tag</h4>
            {!validationResults.mainTag.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.mainTag.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.mainTag)}
        </div>

        {/* Tags Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Design Tags</h4>
            {!validationResults.tags.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.tags.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.tags)}
        </div>

        {/* Design Position Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Design Position</h4>
            {!validationResults.designPosition.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.designPosition.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.designPosition)}
        </div>

        {/* Design Scale Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Design Scale</h4>
            {!validationResults.designScale.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.designScale.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.designScale)}
        </div>

        {/* Overall Status */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Overall Status</h4>
              <p className="text-sm text-gray-500 mt-1">
                All validations must pass before product can be approved
              </p>
            </div>
            {Object.values(validationResults).every(result => result.isValid) ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <AiOutlineCheckCircle className="w-4 h-4 mr-1" />
                Valid
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <AiOutlineWarning className="w-4 h-4 mr-1" />
                Invalid
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ValidationSystem.propTypes = {
  product: PropTypes.shape({
    DesignTitle: PropTypes.string.isRequired,
    Description: PropTypes.string.isRequired,
    ProductType: PropTypes.oneOf(VALID_PRODUCT_TYPES).isRequired,
    originalPrice: PropTypes.number.isRequired,
    Maintag: PropTypes.string.isRequired,
    Designtags: PropTypes.arrayOf(PropTypes.string).isRequired,
    DesignPosition: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired,
    DesignScale: PropTypes.number.isRequired,
    ProductView: PropTypes.oneOf(VALID_VIEWS).isRequired
  }).isRequired,
  onValidationChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ValidationSystem.displayName = 'ValidationSystem';
};

const validateImageUrl = async (url) => {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch (error) {
    console.error('Image validation error:', error);
    return false;
  }
};

const getDesignImageUrl = (designImage) => {
  if (!designImage) return '';
  return typeof designImage === 'string' ? designImage : designImage.url;
};

// Validation Utils
const ValidationUtils = {
  validatePrice: (price, productType) => {
    const minPrice = PRODUCT_TYPES[productType]?.minPrice || 0;
    
    if (!price || isNaN(price)) {
      return { isValid: false, error: 'Price must be a valid number' };
    }
    
    if (price < minPrice) {
      return { 
        isValid: false, 
        error: `Price must be at least £${minPrice} for ${PRODUCT_TYPES[productType].label}` 
      };
    }
    
    if (price > 99999.99) {
      return { isValid: false, error: 'Price cannot exceed £99,999.99' };
    }
    
    return { isValid: true };
  },

  validateTags: (tags) => {
    if (!Array.isArray(tags)) {
      return { isValid: false, error: 'Tags must be provided as an array' };
    }
    
    if (tags.length < 1) {
      return { isValid: false, error: 'At least one tag is required' };
    }
    
    if (tags.length > 7) {
      return { isValid: false, error: 'Maximum 7 tags allowed' };
    }
    
    const uniqueTags = new Set(tags);
    if (uniqueTags.size !== tags.length) {
      return { isValid: false, error: 'Duplicate tags are not allowed' };
    }
    
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        return { isValid: false, error: 'All tags must be non-empty strings' };
      }
      if (tag.length > 50) {
        return { isValid: false, error: 'Individual tags cannot exceed 50 characters' };
      }
    }
    
    return { isValid: true };
  },

  validateMainTag: (tag) => {
    if (!tag || typeof tag !== 'string') {
      return { isValid: false, error: 'Main tag is required' };
    }
    
    if (!MAIN_TAG_CATEGORIES.includes(tag)) {
      return { isValid: false, error: 'Please select a valid main tag category' };
    }
    
    return { isValid: true };
  },

  validateTitle: (title) => {
    if (!title?.trim()) {
      return { isValid: false, error: 'Design title is required' };
    }
    
    if (title.length < 3) {
      return { isValid: false, error: 'Title must be at least 3 characters' };
    }
    
    if (title.length > 100) {
      return { isValid: false, error: 'Title cannot exceed 100 characters' };
    }
    
    return { isValid: true };
  },

  validateDescription: (description) => {
    if (!description?.trim()) {
      return { isValid: false, error: 'Description is required' };
    }
    
    if (description.length < 10) {
      return { isValid: false, error: 'Description must be at least 10 characters' };
    }
    
    if (description.length > 1000) {
      return { isValid: false, error: 'Description cannot exceed 1000 characters' };
    }
    
    return { isValid: true };
  },

  validateDesignPosition: (position, productType, view) => {
    const config = PRODUCT_TYPES[productType]?.mockupConfig?.designArea?.[view];
    
    if (!config) {
      return { isValid: false, error: 'Invalid product configuration' };
    }
    
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      return { isValid: false, error: 'Invalid design position coordinates' };
    }
    
    if (position.x < 0 || position.x > 100 || position.y < 0 || position.y > 100) {
      return { isValid: false, error: 'Design position must be within bounds (0-100)' };
    }
    
    return { isValid: true };
  },

  validateDesignScale: (scale, productType) => {
    const config = PRODUCT_TYPES[productType]?.mockupConfig;
    
    if (!config) {
      return { isValid: false, error: 'Invalid product configuration' };
    }
    
    if (typeof scale !== 'number' || isNaN(scale)) {
      return { isValid: false, error: 'Scale must be a valid number' };
    }
    
    if (scale < config.minScale || scale > config.maxScale) {
      return { 
        isValid: false, 
        error: `Scale must be between ${config.minScale} and ${config.maxScale}` 
      };
    }
    
    return { isValid: true };
  }
};

// Error Handling Utils
const ErrorUtils = {
  handleApiError: (error) => {
    console.error('API Error:', error);
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toast.error(message);
    return message;
  },

  handleImageError: (error, productType, color, view) => {
    console.error('Image Loading Error:', error);
    return `Failed to load ${productType} ${color} ${view} view`;
  }
};const ProductPreview = memo(({ 
  editedProduct,
  onZoom,
  onPositionChange,
  onViewChange,
  disabled = false 
}) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGuides, setShowGuides] = useState(false);
  const [positionMode, setPositionMode] = useState('percentage');
  const [pixelPosition, setPixelPosition] = useState({ x: 0, y: 0 });

  const productConfig = PRODUCT_TYPES[editedProduct.ProductType];
  const colorConfig = COLOR_OPTIONS[editedProduct.ProductColor];
  const designImageUrl = getDesignImageUrl(editedProduct.designImage);

  const convertToPixels = useCallback((percentPosition) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    
    const { width, height } = container.getBoundingClientRect();
    return {
      x: (percentPosition.x * width) / 100,
      y: (percentPosition.y * height) / 100
    };
  }, []);

  const convertToPercentage = useCallback((pixelPos) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    
    const { width, height } = container.getBoundingClientRect();
    return {
      x: (pixelPos.x * 100) / width,
      y: (pixelPos.y * 100) / height
    };
  }, []);

  const handlePositionInput = useCallback((axis, value) => {
    if (disabled) return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    let newPosition;
    if (positionMode === 'percentage') {
      newPosition = {
        ...editedProduct.DesignPosition,
        [axis]: Math.max(0, Math.min(100, numValue))
      };
    } else {
      const container = containerRef.current;
      if (!container) return;
      
      const { width, height } = container.getBoundingClientRect();
      const maxPixels = axis === 'x' ? width : height;
      const pixels = Math.max(0, Math.min(maxPixels, numValue));
      const percentage = (pixels * 100) / maxPixels;
      
      newPosition = {
        ...editedProduct.DesignPosition,
        [axis]: percentage
      };
    }
    
    onPositionChange(newPosition);
  }, [disabled, positionMode, editedProduct.DesignPosition, onPositionChange]);

  const handleDragStart = useCallback((e) => {
    if (disabled) return;
    
    e.preventDefault();
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  }, [disabled]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !containerRef.current || disabled) return;
    
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    const container = containerRef.current.getBoundingClientRect();
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    let newPosition;
    if (positionMode === 'percentage') {
      const deltaXPercent = (deltaX / container.width) * 100;
      const deltaYPercent = (deltaY / container.height) * 100;
      newPosition = {
        x: Math.max(0, Math.min(100, editedProduct.DesignPosition.x + deltaXPercent)),
        y: Math.max(0, Math.min(100, editedProduct.DesignPosition.y + deltaYPercent))
      };
    } else {
      const currentPixels = convertToPixels(editedProduct.DesignPosition);
      const newX = Math.max(0, Math.min(container.width, currentPixels.x + deltaX));
      const newY = Math.max(0, Math.min(container.height, currentPixels.y + deltaY));
      newPosition = convertToPercentage({ x: newX, y: newY });
    }

    setDragStart({ x: clientX, y: clientY });
    onPositionChange(newPosition);
  }, [isDragging, dragStart, editedProduct.DesignPosition, disabled, positionMode, convertToPixels, convertToPercentage, onPositionChange]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    if (disabled || !e.ctrlKey) return;
    
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.max(
      productConfig.mockupConfig.minScale,
      Math.min(productConfig.mockupConfig.maxScale, editedProduct.DesignScale + delta)
    );
    onZoom(newScale);
  }, [disabled, editedProduct.DesignScale, onZoom, productConfig.mockupConfig]);

  const handleImageLoad = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setError(ErrorUtils.handleImageError(
      new Error('Failed to load mockup'),
      editedProduct.ProductType,
      editedProduct.ProductColor,
      editedProduct.ProductView
    ));
  }, [editedProduct.ProductType, editedProduct.ProductColor, editedProduct.ProductView]);

  useEffect(() => {
    const newPixelPos = convertToPixels(editedProduct.DesignPosition);
    setPixelPosition(newPixelPos);
  }, [editedProduct.DesignPosition, convertToPixels]);

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
  }, [isDragging, handleDragMove, handleDragEnd]);return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Product Preview</h3>
          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {VALID_VIEWS.map((view) => (
                <button
                  key={view}
                  onClick={() => onViewChange?.(view)}
                  disabled={disabled}
                  className={`
                    px-3 py-1 rounded-md text-sm font-medium transition-all
                    ${editedProduct.ProductView === view 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>

            {/* Position Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPositionMode('percentage')}
                className={`
                  px-3 py-1 rounded-md text-sm font-medium transition-all
                  ${positionMode === 'percentage'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                %
              </button>
              <button
                onClick={() => setPositionMode('pixels')}
                className={`
                  px-3 py-1 rounded-md text-sm font-medium transition-all
                  ${positionMode === 'pixels'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                px
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onZoom?.(editedProduct.DesignScale - 0.1)}
                disabled={disabled || editedProduct.DesignScale <= productConfig.mockupConfig.minScale}
                className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Zoom Out"
              >
                <BsZoomOut size={20} />
              </button>
              <span className="text-sm text-gray-500">
                {(editedProduct.DesignScale * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => onZoom?.(editedProduct.DesignScale + 0.1)}
                disabled={disabled || editedProduct.DesignScale >= productConfig.mockupConfig.maxScale}
                className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Zoom In"
              >
                <BsZoomIn size={20} />
              </button>
            </div>

            {/* Guidelines Toggle */}
            <button
              onClick={() => setShowGuides(!showGuides)}
              className={`
                p-1 rounded-full hover:bg-gray-100
                ${showGuides ? 'text-blue-600' : 'text-gray-500'}
              `}
              title="Toggle Guidelines"
            >
              <BiRuler size={20} />
            </button>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative aspect-square w-full bg-gray-50 overflow-hidden"
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

        {/* Guidelines */}
        {showGuides && !loading && !error && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-blue-400 opacity-50" />
            <div className="absolute top-1/2 left-0 right-0 border-t border-blue-400 opacity-50" />
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-blue-400 opacity-20" />
              ))}
            </div>
          </div>
        )}

        {/* Design Image */}
        {!loading && !error && designImageUrl && (
          <div
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              left: `${editedProduct.DesignPosition.x}%`,
              top: `${editedProduct.DesignPosition.y}%`,
              width: `${productConfig.mockupConfig.designArea[editedProduct.ProductView].width}px`,
              height: `${productConfig.mockupConfig.designArea[editedProduct.ProductView].height}px`,
              transform: `translate(-50%, -50%) scale(${editedProduct.DesignScale})`,
              mixBlendMode: colorConfig.designBlendMode,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <img
              src={designImageUrl}
              alt="Design"
              className="w-full h-full object-contain"
              draggable={false}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        )}

        {/* Position Indicator */}
        <div className="absolute bottom-4 right-4 bg-black/75 text-white px-3 py-1 rounded-full text-sm">
          {positionMode === 'percentage' ? (
            <>X: {editedProduct.DesignPosition.x.toFixed(1)}% Y: {editedProduct.DesignPosition.y.toFixed(1)}%</>
          ) : (
            <>X: {pixelPosition.x.toFixed(0)}px Y: {pixelPosition.y.toFixed(0)}px</>
          )}
        </div>
      </div>

      {/* Position Controls */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">X Position</label>
              <input
                type="number"
                value={positionMode === 'percentage' 
                  ? editedProduct.DesignPosition.x.toFixed(1)
                  : pixelPosition.x.toFixed(0)
                }
                onChange={(e) => handlePositionInput('x', e.target.value)}
                disabled={disabled}
                className="w-24 px-2 py-1 border border-gray-300 rounded-md"
              />
              <span className="ml-1 text-sm text-gray-500">{positionMode === 'percentage' ? '%' : 'px'}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Y Position</label>
              <input
                type="number"
                value={positionMode === 'percentage'
                  ? editedProduct.DesignPosition.y.toFixed(1)
                  : pixelPosition.y.toFixed(0)
                }
                onChange={(e) => handlePositionInput('y', e.target.value)}
                disabled={disabled}
                className="w-24 px-2 py-1 border border-gray-300 rounded-md"
              />
              <span className="ml-1 text-sm text-gray-500">{positionMode === 'percentage' ? '%' : 'px'}</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {disabled 
              ? 'Preview mode: Design position is locked'
              : 'Drag to adjust design position • Use zoom controls or Ctrl + Mouse Wheel to resize'}
          </div>
        </div>
      </div>
    </div>
  );
});

ProductPreview.propTypes = {
  editedProduct: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    designImage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        url: PropTypes.string.isRequired
      })
    ]).isRequired,
    ProductType: PropTypes.oneOf(VALID_PRODUCT_TYPES).isRequired,
    ProductColor: PropTypes.oneOf(VALID_COLORS).isRequired,
    ProductView: PropTypes.oneOf(VALID_VIEWS).isRequired,
    DesignPosition: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired,
    DesignScale: PropTypes.number.isRequired
  }).isRequired,
  onZoom: PropTypes.func.isRequired,
  onPositionChange: PropTypes.func.isRequired,
  onViewChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ProductPreview.displayName = 'ProductPreview';const ProductListItem = memo(({ 
  product, 
  onApprove, 
  onReject, 
  isProcessing,
  onClick 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }, []);

  const productConfig = PRODUCT_TYPES[product.ProductType];
  const colorConfig = COLOR_OPTIONS[product.ProductColor];

  const profitCalculations = useMemo(() => {
    const basePrice = product.originalPrice || 0;
    const discounted = product.discountPrice || basePrice;
    const baseCost = productConfig.basePrice || 0;
    
    const baseProfit = basePrice - baseCost;
    const discountedProfit = discounted - baseCost;
    
    const baseProfitPercentage = (baseProfit / basePrice) * 100;
    const discountedProfitPercentage = (discountedProfit / discounted) * 100;

    return {
      baseProfit: formatCurrency(baseProfit),
      baseProfitPercentage: baseProfitPercentage.toFixed(1),
      discountedProfit: formatCurrency(discountedProfit),
      discountedProfitPercentage: discountedProfitPercentage.toFixed(1)
    };
  }, [product.originalPrice, product.discountPrice, productConfig.basePrice, formatCurrency]);

  const handleApprove = useCallback(async () => {
    if (window.confirm('Are you sure you want to approve this product?')) {
      await onApprove(product._id);
    }
  }, [product._id, onApprove]);

  const handleReject = useCallback(async () => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      await onReject(product._id, reason);
    }
  }, [product._id, onReject]);

  const designImageUrl = product.designImage?.url || product.designImage;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product Image */}
        <div className="relative aspect-square bg-gray-100">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
            </div>
          )}
          
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              <AiOutlineWarning size={32} />
              <span className="ml-2">Failed to load image</span>
            </div>
          ) : (
            <img
              src={designImageUrl}
              alt={product.DesignTitle}
              className={`w-full h-full object-cover transition-opacity duration-200
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full
            ${STATUS_CONFIG[product.status].color} text-xs font-medium`}>
            {STATUS_CONFIG[product.status].label}
          </div>
        </div>

        {/* Product Details */}
        <div className="p-4 space-y-4 md:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {product.DesignTitle}
              </h3>
              <p className="text-sm text-gray-500">
                {product.shop?.name || 'Unknown Shop'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                {formatCurrency(product.discountPrice || product.originalPrice)}
              </p>
              {product.discountPrice && (
                <p className="text-sm text-gray-500 line-through">
                  {formatCurrency(product.originalPrice)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Product Type:</span>
              <span className="ml-2 font-medium">{productConfig.label}</span>
            </div>
            <div>
              <span className="text-gray-500">Main Tag:</span>
              <span className="ml-2 font-medium">{product.Maintag}</span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2 font-medium">{formatDate(product.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">Product ID:</span>
              <span className="ml-2 font-medium">{product._id}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.Designtags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium
                ${isProcessing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
            >
              <AiOutlineCheckCircle className="w-5 h-5 mr-2" />
              Approve
            </button>

            <button
              onClick={handleReject}
              disabled={isProcessing}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium
                ${isProcessing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
            >
              <AiOutlineDelete className="w-5 h-5 mr-2" />
              Reject
            </button>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {onClick && (
              <button
                onClick={() => onClick(product)}
                className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50"
              >
                View Full Details
              </button>
            )}
          </div>

          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              <div className="prose prose-sm max-w-none">
                <h4 className="text-gray-900">Description</h4>
                <p className="text-gray-700">{product.Description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Profit Margins</h4>
                  <dl className="mt-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Base Profit:</dt>
                      <dd className="font-medium">
                        {profitCalculations.baseProfit} ({profitCalculations.baseProfitPercentage}%)
                      </dd>
                    </div>
                    {product.discountPrice && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Discounted Profit:</dt>
                        <dd className="font-medium">
                          {profitCalculations.discountedProfit} ({profitCalculations.discountedProfitPercentage}%)
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Product Configuration</h4>
                  <dl className="mt-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Base Cost:</dt>
                      <dd className="font-medium">{formatCurrency(productConfig.basePrice)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Design Cost:</dt>
                      <dd className="font-medium">{formatCurrency(productConfig.designCost)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {product.rejectionReason && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900">Rejection Reason</h4>
                  <p className="mt-1 text-sm text-gray-700">{product.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProductListItem.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    DesignTitle: PropTypes.string.isRequired,
    Description: PropTypes.string.isRequired,
    ProductType: PropTypes.oneOf(VALID_PRODUCT_TYPES).isRequired,
    status: PropTypes.oneOf(VALID_STATUSES).isRequired,
    rejectionReason: PropTypes.string,
    originalPrice: PropTypes.number.isRequired,
    discountPrice: PropTypes.number,
    Maintag: PropTypes.string.isRequired,
    Designtags: PropTypes.arrayOf(PropTypes.string).isRequired,
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
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool,
  onClick: PropTypes.func
};

ProductListItem.displayName = 'ProductListItem';const PriceCalculator = memo(({ 
  productType,
  originalPrice,
  discountPrice,
  onChange,
  disabled 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const productConfig = PRODUCT_TYPES[productType];
  const minPrice = productConfig.minPrice;

  const priceCalculations = useMemo(() => {
    const basePrice = originalPrice || 0;
    const discounted = discountPrice || basePrice;
    
    const baseProfitAmount = basePrice - productConfig.basePrice;
    const discountedProfitAmount = discounted - productConfig.basePrice;
    
    const baseProfitPercentage = (baseProfitAmount / basePrice) * 100;
    const discountedProfitPercentage = (discountedProfitAmount / discounted) * 100;

    const discountPercentage = ((basePrice - discounted) / basePrice) * 100;

    return {
      baseProfit: baseProfitAmount.toFixed(2),
      baseProfitPercentage: baseProfitPercentage.toFixed(1),
      discountedProfit: discountedProfitAmount.toFixed(2),
      discountedProfitPercentage: discountedProfitPercentage.toFixed(1),
      discountPercentage: discountPercentage.toFixed(1),
      suggestedPrice: (productConfig.basePrice * 1.4).toFixed(2), // 40% markup
      minimumProfit: (productConfig.basePrice * 0.2).toFixed(2) // 20% minimum profit
    };
  }, [originalPrice, discountPrice, productConfig.basePrice]);

  const handlePriceChange = useCallback((type, value) => {
    if (disabled) return;

    const numValue = parseFloat(value) || 0;
    
    if (type === 'original') {
      if (numValue < minPrice) {
        setPriceError(`Minimum price for ${productConfig.label} is £${minPrice}`);
        return;
      }
      
      if (numValue > 99999.99) {
        setPriceError('Maximum price allowed is £99,999.99');
        return;
      }

      const profitAmount = numValue - productConfig.basePrice;
      if (profitAmount < parseFloat(priceCalculations.minimumProfit)) {
        setPriceError(`Minimum profit required is £${priceCalculations.minimumProfit}`);
        return;
      }
      
      setPriceError(null);
      onChange({
        originalPrice: numValue,
        discountPrice: discountPrice > numValue ? numValue : discountPrice
      });
    } else {
      if (numValue > originalPrice) {
        setPriceError('Discount price cannot be higher than original price');
        return;
      }

      if (numValue && numValue < minPrice) {
        setPriceError(`Discount price cannot be less than £${minPrice}`);
        return;
      }

      const profitAmount = numValue - productConfig.basePrice;
      if (numValue && profitAmount < parseFloat(priceCalculations.minimumProfit)) {
        setPriceError(`Discount price would result in insufficient profit margin`);
        return;
      }
      
      setPriceError(null);
      onChange({
        originalPrice,
        discountPrice: numValue || null
      });
    }
  }, [disabled, minPrice, originalPrice, discountPrice, onChange, productConfig, priceCalculations]);

  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const formatPrice = useCallback((price) => {
    if (!price) return '';
    return price.toFixed(2);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Original Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Original Price (£)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              step="0.01"
              min={minPrice}
              max="99999.99"
              value={formatPrice(originalPrice)}
              onChange={(e) => handlePriceChange('original', e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              className={`
                block w-full pl-7 pr-12 sm:text-sm rounded-md
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                ${priceError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 
                  'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
              `}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">GBP</span>
            </div>
          </div>
        </div>

        {/* Discount Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Discount Price (£)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              step="0.01"
              min={minPrice}
              max={originalPrice}
              value={formatPrice(discountPrice)}
              onChange={(e) => handlePriceChange('discount', e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled || !originalPrice}
              className={`
                block w-full pl-7 pr-12 sm:text-sm rounded-md
                ${(disabled || !originalPrice) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                ${priceError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 
                  'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
              `}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">GBP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {priceError && (
        <p className="text-sm text-red-600">
          {priceError}
        </p>
      )}

      {/* Price Calculations */}
      {!isEditing && (
        <>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {showAdvanced ? 'Hide Details' : 'Show Price Details'}
            </button>
            {originalPrice > 0 && (
              <span className="text-sm text-gray-500">
                Base Cost: £{productConfig.basePrice.toFixed(2)}
              </span>
            )}
          </div>

          {showAdvanced && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Base Profit:</span>
                  <span className="ml-2 font-medium">
                    £{priceCalculations.baseProfit} ({priceCalculations.baseProfitPercentage}%)
                  </span>
                </div>
                {discountPrice > 0 && (
                  <div>
                    <span className="text-gray-500">Discounted Profit:</span>
                    <span className="ml-2 font-medium">
                      £{priceCalculations.discountedProfit} ({priceCalculations.discountedProfitPercentage}%)
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Suggested Price:</span>
                  <span className="ml-2 font-medium">£{priceCalculations.suggestedPrice}</span>
                </div>
                <div>
                  <span className="text-gray-500">Minimum Profit Required:</span>
                  <span className="ml-2 font-medium">£{priceCalculations.minimumProfit}</span>
                </div>
                {discountPrice > 0 && (
                  <div>
                    <span className="text-gray-500">Discount:</span>
                    <span className="ml-2 font-medium">{priceCalculations.discountPercentage}% OFF</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500">
                * Base cost includes production and handling fees
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

PriceCalculator.propTypes = {
  productType: PropTypes.oneOf(VALID_PRODUCT_TYPES).isRequired,
  originalPrice: PropTypes.number,
  discountPrice: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

PriceCalculator.displayName = 'PriceCalculator';const ValidationSystem = memo(({ 
  product, 
  onValidationChange,
  disabled = false 
}) => {
  const [validationResults, setValidationResults] = useState({
    title: { isValid: true },
    description: { isValid: true },
    price: { isValid: true },
    mainTag: { isValid: true },
    tags: { isValid: true },
    designPosition: { isValid: true },
    designScale: { isValid: true }
  });

  const validateAll = useCallback(() => {
    const results = {
      title: ValidationUtils.validateTitle(product.DesignTitle),
      description: ValidationUtils.validateDescription(product.Description),
      price: ValidationUtils.validatePrice(product.originalPrice, product.ProductType),
      mainTag: ValidationUtils.validateMainTag(product.Maintag),
      tags: ValidationUtils.validateTags(product.Designtags),
      designPosition: ValidationUtils.validateDesignPosition(
        product.DesignPosition, 
        product.ProductType,
        product.ProductView
      ),
      designScale: ValidationUtils.validateDesignScale(
        product.DesignScale,
        product.ProductType
      )
    };

    setValidationResults(results);

    const isValid = Object.values(results).every(result => result.isValid);
    const errors = Object.entries(results)
      .filter(([_, result]) => !result.isValid)
      .map(([field, result]) => ({
        field,
        error: result.error
      }));

    onValidationChange(isValid, errors);
    return isValid;
  }, [
    product.DesignTitle,
    product.Description,
    product.originalPrice,
    product.ProductType,
    product.Maintag,
    product.Designtags,
    product.DesignPosition,
    product.DesignScale,
    product.ProductView,
    onValidationChange
  ]);

  useEffect(() => {
    if (!disabled) {
      validateAll();
    }
  }, [disabled, validateAll]);

  const getValidationIcon = useCallback((result) => {
    if (!result) return null;
    return result.isValid ? (
      <AiOutlineCheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AiOutlineWarning className="w-5 h-5 text-red-500" />
    );
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Validation Status
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Title Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Design Title</h4>
            {!validationResults.title.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.title.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.title)}
        </div>

        {/* Description Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Description</h4>
            {!validationResults.description.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.description.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.description)}
        </div>

        {/* Price Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Price</h4>
            {!validationResults.price.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.price.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.price)}
        </div>

        {/* Main Tag Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Main Tag</h4>
            {!validationResults.mainTag.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.mainTag.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.mainTag)}
        </div>

        {/* Tags Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Design Tags</h4>
            {!validationResults.tags.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.tags.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.tags)}
        </div>

        {/* Design Position Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Design Position</h4>
            {!validationResults.designPosition.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.designPosition.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.designPosition)}
        </div>

        {/* Design Scale Validation */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Design Scale</h4>
            {!validationResults.designScale.isValid && (
              <p className="text-sm text-red-600 mt-1">
                {validationResults.designScale.error}
              </p>
            )}
          </div>
          {getValidationIcon(validationResults.designScale)}
        </div>

        {/* Overall Status */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Overall Status</h4>
              <p className="text-sm text-gray-500 mt-1">
                All validations must pass before product can be approved
              </p>
            </div>
            {Object.values(validationResults).every(result => result.isValid) ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <AiOutlineCheckCircle className="w-4 h-4 mr-1" />
                Valid
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <AiOutlineWarning className="w-4 h-4 mr-1" />
                Invalid
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ValidationSystem.propTypes = {
  product: PropTypes.shape({
    DesignTitle: PropTypes.string.isRequired,
    Description: PropTypes.string.isRequired,
    ProductType: PropTypes.oneOf(VALID_PRODUCT_TYPES).isRequired,
    originalPrice: PropTypes.number.isRequired,
    Maintag: PropTypes.string.isRequired,
    Designtags: PropTypes.arrayOf(PropTypes.string).isRequired,
    DesignPosition: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired,
    DesignScale: PropTypes.number.isRequired,
    ProductView: PropTypes.oneOf(VALID_VIEWS).isRequired
  }).isRequired,
  onValidationChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ValidationSystem.displayName = 'ValidationSystem';const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { pendingProducts, isLoading, error } = useSelector((state) => state.product);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list');

  // Fetch pending products on component mount
  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return pendingProducts.filter(product => {
      const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
      const matchesSearch = searchTerm === '' || 
        product.DesignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Maintag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Designtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesStatus && matchesSearch;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priceHigh':
          return (b.discountPrice || b.originalPrice) - (a.discountPrice || a.originalPrice);
        case 'priceLow':
          return (a.discountPrice || a.originalPrice) - (b.discountPrice || b.originalPrice);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [pendingProducts, filterStatus, searchTerm, sortBy]);

  // Handle product approval
  const handleApprove = useCallback(async (productId) => {
    try {
      setIsProcessing(true);
      await dispatch(approveRejectProduct({
        productId,
        status: 'public',
        updates: { visibility: 'public' }
      })).unwrap();
      
      toast.success('Product approved successfully');
      setSelectedProduct(null);
    } catch (error) {
      toast.error(error.message || 'Failed to approve product');
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  // Handle product rejection
  const handleReject = useCallback(async (productId, reason) => {
    try {
      setIsProcessing(true);
      await dispatch(approveRejectProduct({
        productId,
        status: 'rejected',
        statusReason: reason,
        updates: { visibility: 'restricted' }
      })).unwrap();
      
      toast.success('Product rejected');
      setSelectedProduct(null);
    } catch (error) {
      toast.error(error.message || 'Failed to reject product');
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <AiOutlineWarning className="inline-block mr-2" />
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Product Approval Dashboard</h1>
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg shadow p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                  ${viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                  ${viewMode === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                Grid View
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="priceLow">Price: Low to High</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Only</option>
              <option value="public">Approved Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, description, tags..."
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 pl-10 sm:text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <AiOutlineInfoCircle className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <AiOutlineInfoCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'No products are currently pending approval'}
            </p>
          </div>
        )}

        {/* Product List */}
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {filteredProducts.map(product => (
            <ProductListItem
              key={product._id}
              product={product}
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={isProcessing}
              onClick={setSelectedProduct}
            />
          ))}
        </div>

        {/* Product Preview Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Product Preview
                </h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <AiOutlineDelete className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <ProductPreview
                  editedProduct={{
                    ...selectedProduct,
                    DesignPosition: selectedProduct.DesignPosition || { x: 50, y: 50 },
                    DesignScale: selectedProduct.DesignScale || 1
                  }}
                  onZoom={() => {}}
                  onPositionChange={() => {}}
                  onViewChange={() => {}}
                  disabled={true}
                />
              </div>

              <div className="p-4 bg-gray-50 flex justify-end space-x-4">
                <button
                  onClick={() => handleReject(selectedProduct._id)}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedProduct._id)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AdminProductApproval.displayName = 'AdminProductApproval';

export default AdminProductApproval;