import React, { useEffect, useState, memo, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchPendingProducts, approveRejectProduct } from '../../../redux/actions/product';
import styles from "../../../styles/styles";
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

// Version configuration for all product types and their variations
const VERSION_CONFIG = {
  hoodies: {
    white: {
      front: 'v1728392918',
      back: 'v1728392920'
    },
    red: {
      front: 'v1728392919',
      back: 'v1728392918'
    },
    black: {
      front: 'v1728392926',
      back: 'v1728392926'
    },
    blue: {
      front: 'v1728392926',
      back: 'v1728392926'
    },
    gray: {
      front: 'v1728392929',
      back: 'v1728392928'
    }
  },
  't-shirts': {
    white: {
      front: 'v1728393898',
      back: 'v1728393898'
    },
    red: {
      front: 'v1728393899',
      back: 'v1728393901'
    },
    black: {
      front: 'v1728393905',
      back: 'v1728393906'
    },
    blue: {
      front: 'v1728393904',
      back: 'v1728393907'
    },
    gray: {
      front: 'v1728393902',
      back: 'v1728393904'
    },
    green: {
      front: 'v1728393901',
      back: 'v1728393903'
    }
  },
  'long-sleeves': {
    white: {
      front: 'v1728394669',
      back: 'v1728394670'
    },
    red: {
      front: 'v1728394665',
      back: 'v1728394666'
    },
    black: {
      front: 'v1728394673',
      back: 'v1728394674'
    },
    blue: {
      front: 'v1728394666',
      back: 'v1728394673'
    },
    gray: {
      front: 'v1728394669',
      back: 'v1728394669'
    }
  }
};

// Product Types Configuration
const PRODUCT_TYPES = {
  't-shirt': {
    label: 'T-Shirt',
    basePrice: 295, // 205 (production) + 90 (design)
    minPrice: 295,
    designCost: 90,
    mockupConfig: {
      folder: 't-shirts',
      getFilename: (color, view) => `t-shirt-${color}-${view}`,
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
    basePrice: 490, // 400 (production) + 90 (design)
    minPrice: 490,
    designCost: 90,
    mockupConfig: {
      folder: 'hoodies',
      getFilename: (color, view) => `hoodie-${color}-${view}`,
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
    basePrice: 390, // 300 (production) + 90 (design)
    minPrice: 390,
    designCost: 90,
    mockupConfig: {
      folder: 'long-sleeves',
      getFilename: (color, view, isSpecialColor) => {
        if (isSpecialColor && ['black', 'white'].includes(color)) {
          return `longseleves-${color}-${view}`;
        } else if (isSpecialColor && color === 'gray') {
          return `longsleeves-${color}-${view}`;
        }
        return `t-shirt-${color}-${view}`;
      },
      designArea: {
        front: { width: 300, height: 400, top: '25%', left: '50%' },
        back: { width: 300, height: 400, top: '25%', left: '50%' }
      },
      defaultScale: 1,
      minScale: 0.5,
      maxScale: 2
    }
  }
};

// Color Configuration
const COLOR_OPTIONS = {
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
  },
  green: {
    value: 'green',
    label: 'Green',
    hex: '#008000',
    textColor: 'text-white',
    mockupModifier: 'none',
    designBlendMode: 'multiply'
  }
};

// Main Tag Categories
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

// Status Configuration
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
  restricted: {
    value: 'restricted',
    label: 'Restricted',
    color: 'bg-orange-500',
    textColor: 'text-orange-800',
    icon: AiOutlineInfoCircle,
    description: 'Limited availability'
  },
  rejected: {
    value: 'rejected',
    label: 'Rejected',
    color: 'bg-red-500',
    textColor: 'text-red-800',
    icon: AiOutlineWarning,
    description: 'Not approved for sale'
  }
};

// Validation Rules
const VALIDATION_RULES = {
  designTags: {
    min: 1,
    max: 7
  },
  pricing: {
    getMinPrice: (productType) => PRODUCT_TYPES[productType]?.minPrice || 0
  }
};

// Utility Functions
const getMockupUrl = (productType, color, view) => {
  const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
  const config = PRODUCT_TYPES[productType]?.mockupConfig;
  
  if (!config || !color || !view) return "";
  
  const version = VERSION_CONFIG[config.folder]?.[color]?.[view];
  if (!version) return "";
  
  const isSpecialColor = productType === 'long-sleeve';
  const filename = config.getFilename(color, view, isSpecialColor);
  
  return `${baseUrl}${version}/${config.folder}/${filename}.png`;
};

// Validation Utilities
const ValidationUtils = {
  // Price Validation
  validatePrice: (price, productType) => {
    const minPrice = VALIDATION_RULES.pricing.getMinPrice(productType);
    if (!price || price < minPrice) {
      return {
        isValid: false,
        error: `Price must be at least ${minPrice} for ${PRODUCT_TYPES[productType].label}`
      };
    }
    return { isValid: true };
  },

  // Tags Validation
  validateTags: (tags) => {
    if (!Array.isArray(tags)) {
      return {
        isValid: false,
        error: 'Tags must be provided as an array'
      };
    }

    if (tags.length < VALIDATION_RULES.designTags.min) {
      return {
        isValid: false,
        error: `At least ${VALIDATION_RULES.designTags.min} tag is required`
      };
    }

    if (tags.length > VALIDATION_RULES.designTags.max) {
      return {
        isValid: false,
        error: `Maximum ${VALIDATION_RULES.designTags.max} tags allowed`
      };
    }

    return { isValid: true };
  },

  // Main Tag Validation
  validateMainTag: (tag) => {
    if (!tag || !MAIN_TAG_CATEGORIES.includes(tag)) {
      return {
        isValid: false,
        error: 'Please select a valid main tag category'
      };
    }
    return { isValid: true };
  },

  // Design Position Validation
  validateDesignPosition: (position, productType, view) => {
    const config = PRODUCT_TYPES[productType]?.mockupConfig?.designArea?.[view];
    if (!config) {
      return {
        isValid: false,
        error: 'Invalid product configuration'
      };
    }

    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      return {
        isValid: false,
        error: 'Invalid design position'
      };
    }

    return { isValid: true };
  },

  // Design Scale Validation
  validateDesignScale: (scale, productType) => {
    const config = PRODUCT_TYPES[productType]?.mockupConfig;
    if (!config) {
      return {
        isValid: false,
        error: 'Invalid product configuration'
      };
    }

    if (scale < config.minScale || scale > config.maxScale) {
      return {
        isValid: false,
        error: `Scale must be between ${config.minScale} and ${config.maxScale}`
      };
    }

    return { isValid: true };
  },

  // Complete Product Validation
  validateProduct: (product) => {
    const errors = {};

    // Basic fields validation
    if (!product.DesignTitle?.trim()) {
      errors.title = 'Design title is required';
    }

    if (!product.Description?.trim()) {
      errors.description = 'Description is required';
    }

    // Price validation
    const priceValidation = ValidationUtils.validatePrice(product.originalPrice, product.ProductType);
    if (!priceValidation.isValid) {
      errors.price = priceValidation.error;
    }

    // Tags validation
    const tagsValidation = ValidationUtils.validateTags(product.Designtags);
    if (!tagsValidation.isValid) {
      errors.tags = tagsValidation.error;
    }

    // Main tag validation
    const mainTagValidation = ValidationUtils.validateMainTag(product.Maintag);
    if (!mainTagValidation.isValid) {
      errors.mainTag = mainTagValidation.error;
    }

    // Design position validation
    const positionValidation = ValidationUtils.validateDesignPosition(
      product.DesignPosition,
      product.ProductType,
      product.ProductView
    );
    if (!positionValidation.isValid) {
      errors.position = positionValidation.error;
    }

    // Design scale validation
    const scaleValidation = ValidationUtils.validateDesignScale(
      product.DesignScale,
      product.ProductType
    );
    if (!scaleValidation.isValid) {
      errors.scale = scaleValidation.error;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Error Handling Utilities
const ErrorUtils = {
  // Handle API Errors
  handleApiError: (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'Server error occurred';
      toast.error(message);
      return message;
    } else if (error.request) {
      // Request made but no response
      const message = 'No response from server';
      toast.error(message);
      return message;
    } else {
      // Request setup error
      const message = error.message || 'An error occurred';
      toast.error(message);
      return message;
    }
  },

  // Handle Image Loading Errors
  handleImageError: (error, productType, color, view) => {
    console.error('Image Loading Error:', error);
    return `Failed to load ${productType} ${color} ${view} view`;
  },

  // Handle Validation Errors
  handleValidationErrors: (errors) => {
    const messages = Object.values(errors);
    messages.forEach(message => toast.error(message));
    return messages;
  }
};

// URL Validation Utility
const validateImageUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('URL Validation Error:', error);
    return false;
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`${styles.section} flex items-center justify-center`}>
          <div className="text-center">
            <AiOutlineWarning size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className={styles.button}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};// ProductPreview Component
const ProductPreview = memo(({ 
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

  // Get product configuration
  const productConfig = PRODUCT_TYPES[editedProduct.ProductType];
  const colorConfig = COLOR_OPTIONS[editedProduct.ProductColor];

  // Calculate mockup URL
  const mockupUrl = useMemo(() => {
    return getMockupUrl(
      editedProduct.ProductType,
      editedProduct.ProductColor,
      editedProduct.ProductView
    );
  }, [editedProduct.ProductType, editedProduct.ProductColor, editedProduct.ProductView]);

  // Handle design position constraints
  const getPositionConstraints = useCallback(() => {
    const designArea = productConfig.mockupConfig.designArea[editedProduct.ProductView];
    return {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      defaultX: parseFloat(designArea.left),
      defaultY: parseFloat(designArea.top)
    };
  }, [productConfig, editedProduct.ProductView]);

  // Handle drag operations
  const handleDragStart = useCallback((e) => {
    if (disabled) return;
    
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
    const deltaX = (clientX - dragStart.x) / container.width * 100;
    const deltaY = (clientY - dragStart.y) / container.height * 100;

    const constraints = getPositionConstraints();
    const newPosition = {
      x: Math.max(constraints.minX, Math.min(constraints.maxX, editedProduct.DesignPosition.x + deltaX)),
      y: Math.max(constraints.minY, Math.min(constraints.maxY, editedProduct.DesignPosition.y + deltaY))
    };

    setDragStart({ x: clientX, y: clientY });
    onPositionChange?.(newPosition);
  }, [isDragging, dragStart, editedProduct.DesignPosition, disabled, getPositionConstraints, onPositionChange]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Image loading handlers
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

  // Effect for drag event listeners
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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Product Preview</h3>
          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['front', 'back'].map((view) => (
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

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onZoom?.(editedProduct.DesignScale * 0.9)}
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
                onClick={() => onZoom?.(editedProduct.DesignScale * 1.1)}
                disabled={disabled || editedProduct.DesignScale >= productConfig.mockupConfig.maxScale}
                className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                title="Zoom In"
              >
                <BsZoomIn size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative aspect-square w-full bg-gray-50 overflow-hidden"
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

        {/* Mockup Image */}
        <img
          src={mockupUrl}
          alt={`${editedProduct.ProductType} ${editedProduct.ProductColor} ${editedProduct.ProductView} view`}
          className="w-full h-full object-contain"
          style={{
            filter: colorConfig.mockupModifier !== 'none' ? colorConfig.mockupModifier : undefined
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Design Overlay */}
        {!loading && !error && editedProduct.designImage && (
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
              mixBlendMode: colorConfig.designBlendMode
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <img
              src={editedProduct.designImage}
              alt="Design"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 text-sm text-gray-500">
        <p>
          {disabled 
            ? 'Preview mode: Design position is locked'
            : 'Drag to adjust design position • Use zoom controls to resize'}
        </p>
      </div>
    </div>
  );
});

ProductPreview.propTypes = {
  editedProduct: PropTypes.shape({
    ProductType: PropTypes.string.isRequired,
    ProductColor: PropTypes.string.isRequired,
    ProductView: PropTypes.string.isRequired,
    DesignPosition: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired,
    DesignScale: PropTypes.number.isRequired,
    designImage: PropTypes.string
  }).isRequired,
  onZoom: PropTypes.func,
  onPositionChange: PropTypes.func,
  onViewChange: PropTypes.func,
  disabled: PropTypes.bool
};

ProductPreview.displayName = 'ProductPreview';

const PriceCalculator = memo(({ 
  productType,
  originalPrice,
  discountPrice,
  onChange,
  disabled
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceError, setPriceError] = useState(null);
  
  const productConfig = PRODUCT_TYPES[productType];
  const minPrice = productConfig.minPrice;

  // Validate and handle price changes
  const handlePriceChange = useCallback((type, value) => {
    if (disabled) return;

    const numValue = parseFloat(value) || 0;
    
    if (type === 'original') {
      if (numValue < minPrice) {
        setPriceError(`Minimum price for ${productConfig.label} is £${minPrice}`);
        return;
      }
      
      setPriceError(null);
      onChange({
        originalPrice: numValue,
        discountPrice: discountPrice > numValue ? numValue : discountPrice
      });
    } else {
      // Handling discount price
      if (numValue > originalPrice) {
        setPriceError('Discount price cannot be higher than original price');
        return;
      }
      
      setPriceError(null);
      onChange({
        originalPrice,
        discountPrice: numValue
      });
    }
  }, [disabled, minPrice, originalPrice, discountPrice, onChange, productConfig.label]);

  // Calculate profit margins
  const calculateProfits = useMemo(() => {
    const basePrice = originalPrice || 0;
    const discounted = discountPrice || basePrice;
    
    const baseProfitAmount = basePrice - productConfig.basePrice;
    const discountedProfitAmount = discounted - productConfig.basePrice;
    
    const baseProfitPercentage = (baseProfitAmount / basePrice) * 100;
    const discountedProfitPercentage = (discountedProfitAmount / discounted) * 100;

    return {
      baseProfit: baseProfitAmount.toFixed(2),
      baseProfitPercentage: baseProfitPercentage.toFixed(1),
      discountedProfit: discountedProfitAmount.toFixed(2),
      discountedProfitPercentage: discountedProfitPercentage.toFixed(1)
    };
  }, [originalPrice, discountPrice, productConfig.basePrice]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Price Configuration</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showAdvanced ? 'Simple View' : 'Advanced Options'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Price Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Price (£)
            </label>
            <div className="relative">
              <input
                type="number"
                value={originalPrice || ''}
                onChange={(e) => handlePriceChange('original', e.target.value)}
                disabled={disabled}
                min={minPrice}
                step="0.01"
                className={`
                  w-full px-3 py-2 border rounded-lg
                  ${disabled ? 'bg-gray-100' : 'bg-white'}
                  ${priceError ? 'border-red-300' : 'border-gray-300'}
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                `}
              />
              {originalPrice < minPrice && (
                <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                  <AiOutlineWarning className="text-red-500" />
                </div>
              )}
            </div>
            {priceError && (
              <p className="mt-1 text-sm text-red-600">
                {priceError}
              </p>
            )}
          </div>

          {/* Discount Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Price (£) - Optional
            </label>
            <input
              type="number"
              value={discountPrice || ''}
              onChange={(e) => handlePriceChange('discount', e.target.value)}
              disabled={disabled}
              min="0"
              max={originalPrice}
              step="0.01"
              className={`
                w-full px-3 py-2 border rounded-lg
                ${disabled ? 'bg-gray-100' : 'bg-white'}
                ${discountPrice > originalPrice ? 'border-red-300' : 'border-gray-300'}
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              `}
            />
          </div>
        </div>

        {/* Minimum Price Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <AiOutlineInfoCircle className="text-blue-500" size={20} />
            <p className="text-sm text-blue-700">
              Minimum price for {productConfig.label}: £{minPrice}
            </p>
          </div>
        </div>

        {/* Advanced Price Details */}
        {showAdvanced && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Price Breakdown</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Base Cost</p>
                  <p className="text-lg font-bold">£{productConfig.basePrice}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Design Cost</p>
                  <p className="text-lg font-bold">£{productConfig.designCost}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Your Profit</p>
                  <p className="text-lg font-bold">£{calculateProfits.baseProfit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profit Margin</p>
                  <p className="text-lg font-bold">{calculateProfits.baseProfitPercentage}%</p>
                </div>
                {discountPrice && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Discounted Profit</p>
                      <p className="text-lg font-bold">£{calculateProfits.discountedProfit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Discounted Margin</p>
                      <p className="text-lg font-bold">{calculateProfits.discountedProfitPercentage}%</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Final Price</p>
            <p className="text-xl font-bold text-gray-900">
              £{originalPrice?.toFixed(2) || '0.00'}
              {discountPrice && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  £{discountPrice.toFixed(2)}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Profit per sale</p>
            <p className="text-xl font-bold text-gray-900">
              £{calculateProfits.baseProfit}
              <span className="ml-2 text-sm text-gray-500">
                ({calculateProfits.baseProfitPercentage}%)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

PriceCalculator.propTypes = {
  productType: PropTypes.string.isRequired,
  originalPrice: PropTypes.number,
  discountPrice: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

PriceCalculator.displayName = 'PriceCalculator';const ValidationSystem = memo(({ 
  product, 
  onStatusChange,
  onValidationComplete,
  disabled 
}) => {
  const [validationState, setValidationState] = useState({
    isValidating: false,
    currentStatus: product.status || 'pending',
    validationErrors: [],
    statusReason: product.statusReason || ''
  });

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Validation checks
  const validateProduct = useCallback(async () => {
    const errors = [];

    // Title validation
    if (!product.DesignTitle?.trim()) {
      errors.push('Design title is required');
    } else if (product.DesignTitle.length < 3) {
      errors.push('Design title must be at least 3 characters');
    }

    // Description validation
    if (!product.Description?.trim()) {
      errors.push('Description is required');
    } else if (product.Description.length < 10) {
      errors.push('Description must be at least 10 characters');
    }

    // Price validation
    const priceValidation = ValidationUtils.validatePrice(
      product.originalPrice,
      product.ProductType
    );
    if (!priceValidation.isValid) {
      errors.push(priceValidation.error);
    }
    if (product.discountPrice && product.discountPrice > product.originalPrice) {
      errors.push('Discount price cannot be higher than original price');
    }

    // Tags validation
    const tagsValidation = ValidationUtils.validateTags(product.Designtags);
    if (!tagsValidation.isValid) {
      errors.push(tagsValidation.error);
    }

    // Main tag validation
    const mainTagValidation = ValidationUtils.validateMainTag(product.Maintag);
    if (!mainTagValidation.isValid) {
      errors.push(mainTagValidation.error);
    }

    // Design position and scale validation
    const positionValidation = ValidationUtils.validateDesignPosition(
      product.DesignPosition,
      product.ProductType,
      product.ProductView
    );
    if (!positionValidation.isValid) {
      errors.push(positionValidation.error);
    }

    const scaleValidation = ValidationUtils.validateDesignScale(
      product.DesignScale,
      product.ProductType
    );
    if (!scaleValidation.isValid) {
      errors.push(scaleValidation.error);
    }

    // Design image validation
    try {
      const imageValid = await validateImageUrl(product.designImage);
      if (!imageValid) {
        errors.push('Invalid or inaccessible design image');
      }
    } catch (error) {
      errors.push('Failed to validate design image');
    }

    return errors;
  }, [product]);

  // Handle status change
  const handleStatusChange = useCallback(async (newStatus, reason = '') => {
    if (disabled) return;

    setValidationState(prev => ({
      ...prev,
      isValidating: true,
      validationErrors: []
    }));

    try {
      const errors = await validateProduct();

      if (!isMounted.current) return;

      if (errors.length > 0) {
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          validationErrors: errors
        }));
        onValidationComplete?.(false, errors);
        return;
      }

      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        currentStatus: newStatus,
        statusReason: reason,
        validationErrors: []
      }));

      onStatusChange?.(newStatus, reason);
      onValidationComplete?.(true);

    } catch (error) {
      if (!isMounted.current) return;

      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        validationErrors: ['Validation failed: ' + error.message]
      }));
      onValidationComplete?.(false, ['Validation failed: ' + error.message]);
    }
  }, [disabled, validateProduct, onStatusChange, onValidationComplete]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Product Validation & Status
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Status */}
        <div className="flex items-center space-x-3">
          <div className={`
            w-3 h-3 rounded-full
            ${STATUS_CONFIG[validationState.currentStatus].color}
          `} />
          <span className="font-medium text-gray-900">
            {STATUS_CONFIG[validationState.currentStatus].label}
          </span>
        </div>

        {/* Status Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Public Button */}
          <button
            onClick={() => handleStatusChange('public')}
            disabled={disabled || validationState.isValidating}
            className={`
              flex items-center justify-center px-4 py-2 rounded-lg
              ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700 hover:bg-green-200'}
              font-medium transition-colors duration-200
            `}
          >
            <AiOutlineCheckCircle className="mr-2" size={20} />
            Make Public
          </button>

          {/* Restricted Button */}
          <button
            onClick={() => handleStatusChange('restricted')}
            disabled={disabled || validationState.isValidating}
            className={`
              flex items-center justify-center px-4 py-2 rounded-lg
              ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}
              font-medium transition-colors duration-200
            `}
          >
            <AiOutlineInfoCircle className="mr-2" size={20} />
            Mark Restricted
          </button>

          {/* Reject Button */}
          <button
            onClick={() => {
              const reason = window.prompt('Please provide a reason for rejection:');
              if (reason) {
                handleStatusChange('rejected', reason);
              }
            }}
            disabled={disabled || validationState.isValidating}
            className={`
              flex items-center justify-center px-4 py-2 rounded-lg
              ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-red-100 text-red-700 hover:bg-red-200'}
              font-medium transition-colors duration-200
            `}
          >
            <AiOutlineWarning className="mr-2" size={20} />
            Reject Design
          </button>
        </div>

        {/* Validation Errors */}
        {validationState.validationErrors.length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-start">
              <AiOutlineWarning className="text-red-500 mt-0.5 mr-3" size={20} />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Validation Failed
                </h4>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  {validationState.validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {validationState.currentStatus === 'rejected' && validationState.statusReason && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Rejection Reason:
            </h4>
            <p className="text-sm text-gray-700">
              {validationState.statusReason}
            </p>
          </div>
        )}

        {/* Status Description */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start">
            <AiOutlineInfoCircle className="text-blue-500 mt-0.5 mr-3" size={20} />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">
                Status Information
              </h4>
              <p className="text-sm text-blue-700">
                {STATUS_CONFIG[validationState.currentStatus].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {validationState.isValidating && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
});

ValidationSystem.propTypes = {
  product: PropTypes.shape({
    DesignTitle: PropTypes.string,
    Description: PropTypes.string,
    ProductType: PropTypes.string.isRequired,
    ProductView: PropTypes.string.isRequired,
    DesignPosition: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired,
    DesignScale: PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    discountPrice: PropTypes.number,
    Designtags: PropTypes.arrayOf(PropTypes.string),
    Maintag: PropTypes.string,
    designImage: PropTypes.string,
    status: PropTypes.string,
    statusReason: PropTypes.string
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onValidationComplete: PropTypes.func,
  disabled: PropTypes.bool
};

ValidationSystem.displayName = 'ValidationSystem';const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { pendingProducts, loading, error } = useSelector((state) => state.product);
  
  const [editedProduct, setEditedProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Initial data fetch
  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  // Product selection handler
  const handleProductSelect = useCallback((product) => {
    setSelectedProductId(product._id);
    setEditedProduct({
      ...product,
      DesignPosition: product.DesignPosition || { x: 50, y: 50 },
      DesignScale: product.DesignScale || 1
    });
  }, []);

  // Design position update handler
  const handlePositionUpdate = useCallback((newPosition) => {
    if (!editedProduct || processingAction) return;

    setEditedProduct(prev => ({
      ...prev,
      DesignPosition: newPosition
    }));
  }, [editedProduct, processingAction]);

  // Design scale update handler
  const handleScaleUpdate = useCallback((newScale) => {
    if (!editedProduct || processingAction) return;

    setEditedProduct(prev => ({
      ...prev,
      DesignScale: newScale
    }));
  }, [editedProduct, processingAction]);

  // Price update handler
  const handlePriceUpdate = useCallback(({ originalPrice, discountPrice }) => {
    if (!editedProduct || processingAction) return;

    setEditedProduct(prev => ({
      ...prev,
      originalPrice,
      discountPrice: discountPrice || null
    }));
  }, [editedProduct, processingAction]);

  // View change handler
  const handleViewChange = useCallback((newView) => {
    if (!editedProduct || processingAction) return;

    setEditedProduct(prev => ({
      ...prev,
      ProductView: newView
    }));
  }, [editedProduct, processingAction]);

  // Status change handler
  const handleStatusChange = useCallback(async (newStatus, reason = '') => {
    if (!editedProduct || processingAction) return;

    try {
      setProcessingAction(true);

      const success = await dispatch(approveRejectProduct({
        productId: editedProduct._id,
        status: newStatus,
        statusReason: reason,
        updates: {
          DesignPosition: editedProduct.DesignPosition,
          DesignScale: editedProduct.DesignScale,
          originalPrice: editedProduct.originalPrice,
          discountPrice: editedProduct.discountPrice,
          ProductView: editedProduct.ProductView
        }
      })).unwrap();

      if (success) {
        toast.success(`Product ${newStatus === 'public' ? 'approved' : newStatus}`);
        setEditedProduct(null);
        setSelectedProductId(null);
        dispatch(fetchPendingProducts());
      }
    } catch (err) {
      toast.error(ErrorUtils.handleApiError(err));
    } finally {
      setProcessingAction(false);
    }
  }, [editedProduct, processingAction, dispatch]);

  return (
    <ErrorBoundary>
      <div className={styles.section}>
        <div className="mb-8">
          <h1 className={styles.heading}>Product Approval Dashboard</h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Product List Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Pending Products
                  </h2>
                  {loading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                  )}
                </div>
              </div>

              {error ? (
                <div className="p-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex">
                      <AiOutlineWarning className="text-red-500 mt-0.5 mr-3" size={20} />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : pendingProducts?.length === 0 ? (
                <div className="p-8 text-center">
                  <AiOutlineCheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                  <p className="text-gray-500">No pending products to review</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-[calc(100vh-220px)] overflow-y-auto">
           {pendingProducts?.map((product) => (
  <button
    key={product._id}
    onClick={() => handleProductSelect(product)}
    className={`
      w-full p-4 text-left transition-colors duration-200 hover:bg-gray-50
      ${selectedProductId === product._id ? 'bg-blue-50' : ''}
    `}
  >
    <h3 className="font-medium text-gray-900 mb-1">
      {product.DesignTitle || 'Untitled Design'}
    </h3>
    <p className="text-sm text-gray-500 mb-2">
      {product.ProductType || 'Unknown Type'} • {formatDate(product.createdAt)}
    </p>
    <div className="flex items-center text-sm">
      <span className={`
        px-2 py-1 rounded-full text-xs font-medium
        ${STATUS_CONFIG[product.status || 'pending'].color.replace('bg-', 'bg-opacity-20 ')}
        ${STATUS_CONFIG[product.status || 'pending'].textColor}
      `}>
        {STATUS_CONFIG[product.status || 'pending'].label}
      </span>
    </div>
  </button>
))}
                </div>
              )}
            </div>
          </div>

          {/* Product Preview and Controls */}
          <div className="lg:col-span-8 xl:col-span-9">
            {editedProduct ? (
              <div className="space-y-8">
                {/* Product Preview */}
                <ProductPreview
                  editedProduct={editedProduct}
                  onZoom={handleScaleUpdate}
                  onPositionChange={handlePositionUpdate}
                  onViewChange={handleViewChange}
                  disabled={processingAction}
                />

                {/* Price Calculator */}
                <PriceCalculator
                  productType={editedProduct.ProductType}
                  originalPrice={editedProduct.originalPrice}
                  discountPrice={editedProduct.discountPrice}
                  onChange={handlePriceUpdate}
                  disabled={processingAction}
                />

                {/* Validation System */}
                <ValidationSystem
                  product={editedProduct}
                  onStatusChange={handleStatusChange}
                  disabled={processingAction}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="max-w-md mx-auto">
                  <AiOutlineInfoCircle size={48} className="mx-auto text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Select a Product to Review
                  </h3>
                  <p className="text-gray-500">
                    Choose a product from the list to start the review process
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Utility function for date formatting
const formatDate = (dateString) => {
  try {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};
export default memo(AdminProductApproval);