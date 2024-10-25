import React, { useEffect, useState, memo, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
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

// Constants and Configurations
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
};// Product Types Configuration
const PRODUCT_TYPES = {
  't-shirt': {
    label: 'T-Shirt',
    basePrice: 295,
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
    basePrice: 490,
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
    basePrice: 390,
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

// Main Tag Categories and Options
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

const MAIN_TAG_OPTIONS = MAIN_TAG_CATEGORIES.map(tag => ({
  value: tag,
  label: tag
}));

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
  },
  title: {
    minLength: 3,
    maxLength: 100
  },
  description: {
    minLength: 10,
    maxLength: 500
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

// Format date with error handling
const formatDate = (dateString) => {
  try {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};// Validation Utilities
const ValidationUtils = {
  // Price Validation
  validatePrice: (price, productType) => {
    const minPrice = VALIDATION_RULES.pricing.getMinPrice(productType);
    if (!price || isNaN(price)) {
      return {
        isValid: false,
        error: 'Price must be a valid number'
      };
    }
    if (price < minPrice) {
      return {
        isValid: false,
        error: `Price must be at least £${minPrice} for ${PRODUCT_TYPES[productType].label}`
      };
    }
    if (price > 99999.99) {
      return {
        isValid: false,
        error: 'Price cannot exceed £99,999.99'
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

    // Check for duplicate tags
    const uniqueTags = new Set(tags);
    if (uniqueTags.size !== tags.length) {
      return {
        isValid: false,
        error: 'Duplicate tags are not allowed'
      };
    }

    // Validate individual tags
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        return {
          isValid: false,
          error: 'All tags must be non-empty strings'
        };
      }
      if (tag.length > 30) {
        return {
          isValid: false,
          error: 'Individual tags cannot exceed 30 characters'
        };
      }
    }

    return { isValid: true };
  },

  // Main Tag Validation
  validateMainTag: (tag) => {
    if (!tag || typeof tag !== 'string') {
      return {
        isValid: false,
        error: 'Main tag is required'
      };
    }

    if (!MAIN_TAG_CATEGORIES.includes(tag)) {
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
        error: 'Invalid design position coordinates'
      };
    }

    if (position.x < 0 || position.x > 100 || position.y < 0 || position.y > 100) {
      return {
        isValid: false,
        error: 'Design position must be within bounds (0-100)'
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

    if (typeof scale !== 'number' || isNaN(scale)) {
      return {
        isValid: false,
        error: 'Scale must be a valid number'
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

  // Title Validation
  validateTitle: (title) => {
    if (!title?.trim()) {
      return {
        isValid: false,
        error: 'Design title is required'
      };
    }

    if (title.length < VALIDATION_RULES.title.minLength) {
      return {
        isValid: false,
        error: `Title must be at least ${VALIDATION_RULES.title.minLength} characters`
      };
    }

    if (title.length > VALIDATION_RULES.title.maxLength) {
      return {
        isValid: false,
        error: `Title cannot exceed ${VALIDATION_RULES.title.maxLength} characters`
      };
    }

    return { isValid: true };
  },

  // Description Validation
  validateDescription: (description) => {
    if (!description?.trim()) {
      return {
        isValid: false,
        error: 'Description is required'
      };
    }

    if (description.length < VALIDATION_RULES.description.minLength) {
      return {
        isValid: false,
        error: `Description must be at least ${VALIDATION_RULES.description.minLength} characters`
      };
    }

    if (description.length > VALIDATION_RULES.description.maxLength) {
      return {
        isValid: false,
        error: `Description cannot exceed ${VALIDATION_RULES.description.maxLength} characters`
      };
    }

    return { isValid: true };
  },

  // Complete Product Validation
  validateProduct: async (product) => {
    const errors = {};

    // Title validation
    const titleValidation = ValidationUtils.validateTitle(product.DesignTitle);
    if (!titleValidation.isValid) {
      errors.title = titleValidation.error;
    }

    // Description validation
    const descriptionValidation = ValidationUtils.validateDescription(product.Description);
    if (!descriptionValidation.isValid) {
      errors.description = descriptionValidation.error;
    }

    // Price validation
    const priceValidation = ValidationUtils.validatePrice(product.originalPrice, product.ProductType);
    if (!priceValidation.isValid) {
      errors.price = priceValidation.error;
    }

    if (product.discountPrice !== null && product.discountPrice !== undefined) {
      const discountValidation = ValidationUtils.validatePrice(product.discountPrice, product.ProductType);
      if (!discountValidation.isValid) {
        errors.discountPrice = discountValidation.error;
      }
      if (product.discountPrice >= product.originalPrice) {
        errors.discountPrice = 'Discount price must be less than original price';
      }
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

    // Design image validation
    try {
      const imageValid = await validateImageUrl(product.designImage);
      if (!imageValid) {
        errors.designImage = 'Invalid or inaccessible design image';
      }
    } catch (error) {
      errors.designImage = 'Failed to validate design image';
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
      const message = error.response.data?.message || 'Server error occurred';
      toast.error(message);
      return message;
    } else if (error.request) {
      const message = 'No response from server';
      toast.error(message);
      return message;
    } else {
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
    if (typeof errors === 'string') {
      toast.error(errors);
      return [errors];
    }
    
    const messages = Object.values(errors);
    messages.forEach(message => toast.error(message));
    return messages;
  },

  // Handle Network Errors
  handleNetworkError: (error) => {
    console.error('Network Error:', error);
    const message = 'Network error occurred. Please check your connection.';
    toast.error(message);
    return message;
  }
};

// URL Validation Utility
const validateImageUrl = async (url) => {
  try {
    if (!url) return false;
    
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error('Image validation failed:', response.status, response.statusText);
      return false;
    }

    const contentType = response.headers.get('content-type');
    return contentType?.startsWith('image/');
  } catch (error) {
    console.error('URL Validation Error:', error);
    return false;
  }
};// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`${styles.section} flex items-center justify-center`}>
          <div className="text-center max-w-lg w-full">
            <AiOutlineWarning size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-left mt-4">
                <summary className="text-sm text-blue-600 cursor-pointer">
                  Technical Details
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-auto text-xs text-gray-800">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className={`${styles.button} mt-4`}
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
};

// ProductMetadata Component
const ProductMetadata = memo(({ product, onMainTagChange, disabled }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Product Metadata</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            {showAdvanced ? 'Basic View' : 'Show Advanced'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Design Title
            </label>
            <div className="relative">
              <input
                type="text"
                value={product.DesignTitle || ''}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
              />
              <div className="absolute right-2 top-2 text-gray-400">
                {product.DesignTitle?.length || 0}/{VALIDATION_RULES.title.maxLength}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Information
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={product.shop?.name || 'N/A'}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
              />
              {product.shop?._id && (
                <Link
                  to={`/shop/${product.shop._id}`}
                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Shop
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <div className="relative">
            <textarea
              value={product.Description || ''}
              readOnly
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 resize-none"
            />
            <div className="absolute right-2 bottom-2 text-gray-400">
              {product.Description?.length || 0}/{VALIDATION_RULES.description.maxLength}
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Tag
            </label>
            <select
              value={product.Maintag || ''}
              onChange={(e) => onMainTagChange(e.target.value)}
              disabled={disabled}
              className={`
                w-full px-3 py-2 border border-gray-300 rounded-lg
                ${disabled ? 'bg-gray-50' : 'bg-white'}
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              `}
            >
              <option value="">Select Main Tag</option>
              {MAIN_TAG_OPTIONS.map(tag => (
                <option key={tag.value} value={tag.value}>
                  {tag.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Design Tags ({product.Designtags?.length || 0}/{VALIDATION_RULES.designTags.max})
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border border-gray-300 rounded-lg min-h-[42px]">
              {product.Designtags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Information */}
        {showAdvanced && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type
                </label>
                <input
                  type="text"
                  value={PRODUCT_TYPES[product.ProductType]?.label || product.ProductType || 'N/A'}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: COLOR_OPTIONS[product.ProductColor]?.hex }}
                  />
                  <input
                    type="text"
                    value={COLOR_OPTIONS[product.ProductColor]?.label || product.ProductColor || 'N/A'}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <input
                  type="text"
                  value={formatDate(product.createdAt)}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <input
                  type="text"
                  value={formatDate(product.updatedAt)}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>
            </div>

            {/* Design Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Design Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Design Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-500">X Position</span>
                      <input
                        type="text"
                        value={`${product.DesignPosition?.x.toFixed(2)}%`}
                        readOnly
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Y Position</span>
                      <input
                        type="text"
                        value={`${product.DesignPosition?.y.toFixed(2)}%`}
                        readOnly
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Design Scale
                  </label>
                  <input
                    type="text"
                    value={`${(product.DesignScale * 100).toFixed(0)}%`}
                    readOnly
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

ProductMetadata.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    DesignTitle: PropTypes.string,
    Description: PropTypes.string,
    ProductType: PropTypes.string.isRequired,
    ProductColor: PropTypes.string.isRequired,
    ProductView: PropTypes.string.isRequired,
    Maintag: PropTypes.string,
    Designtags: PropTypes.arrayOf(PropTypes.string),
    DesignPosition: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired,
    DesignScale: PropTypes.number.isRequired,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    shop: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  }).isRequired,
  onMainTagChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ProductMetadata.displayName = 'ProductMetadata';// ProductPreview Component
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
  const [showGuides, setShowGuides] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

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

  // Handle design position constraints with guidelines
  const getPositionConstraints = useCallback(() => {
    const designArea = productConfig.mockupConfig.designArea[editedProduct.ProductView];
    const containerBounds = containerRef.current?.getBoundingClientRect();
    const scaleFactor = containerBounds ? containerBounds.width / imageSize.width : 1;

    return {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      defaultX: parseFloat(designArea.left),
      defaultY: parseFloat(designArea.top),
      scaleFactor,
      designAreaWidth: designArea.width * scaleFactor * editedProduct.DesignScale,
      designAreaHeight: designArea.height * scaleFactor * editedProduct.DesignScale
    };
  }, [productConfig, editedProduct.ProductView, editedProduct.DesignScale, imageSize]);

  // Debounced position update
  const debouncedPositionUpdate = useMemo(
    () => debounce(onPositionChange, 16),
    [onPositionChange]
  );

  // Handle drag operations
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
    const deltaX = (clientX - dragStart.x) / container.width * 100;
    const deltaY = (clientY - dragStart.y) / container.height * 100;

    const constraints = getPositionConstraints();
    const newPosition = {
      x: Math.max(constraints.minX, Math.min(constraints.maxX, editedProduct.DesignPosition.x + deltaX)),
      y: Math.max(constraints.minY, Math.min(constraints.maxY, editedProduct.DesignPosition.y + deltaY))
    };

    setDragStart({ x: clientX, y: clientY });
    debouncedPositionUpdate(newPosition);
  }, [isDragging, dragStart, editedProduct.DesignPosition, disabled, getPositionConstraints, debouncedPositionUpdate]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    debouncedPositionUpdate.flush();
  }, [debouncedPositionUpdate]);

  // Handle zoom with mouse wheel
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

  // Image loading handlers
  const handleImageLoad = useCallback((e) => {
    setLoading(false);
    setError(null);
    setImageSize({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    });
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
      debouncedPositionUpdate.cancel();
    };
  }, [isDragging, handleDragMove, handleDragEnd, debouncedPositionUpdate]);

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
          draggable={false}
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
              mixBlendMode: colorConfig.designBlendMode,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
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
        <div className="flex items-center justify-between">
          <p>
            {disabled 
              ? 'Preview mode: Design position is locked'
              : 'Drag to adjust design position • Use zoom controls or Ctrl + Mouse Wheel to resize'}
          </p>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              Position: {editedProduct.DesignPosition.x.toFixed(1)}%, {editedProduct.DesignPosition.y.toFixed(1)}%
            </p>
          </div>
        </div>
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
  onZoom: PropTypes.func.isRequired,
  onPositionChange: PropTypes.func.isRequired,
  onViewChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ProductPreview.displayName = 'ProductPreview';const PriceCalculator = memo(({ 
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

  // Calculate all price-related values
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

  // Validate and handle price changes with improved error checking
  const handlePriceChange = useCallback((type, value) => {
    if (disabled) return;

    const numValue = parseFloat(value) || 0;
    
    if (type === 'original') {
      // Validate original price
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
      // Validate discount price
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

  // Handle price input focus/blur
  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Format price for display
  const formatPrice = useCallback((price) => {
    if (!price) return '';
    return price.toFixed(2);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Price Configuration</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
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
                value={isEditing ? originalPrice || '' : formatPrice(originalPrice)}
                onChange={(e) => handlePriceChange('original', e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
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
            <div className="relative">
              <input
                type="number"
                value={isEditing ? discountPrice || '' : formatPrice(discountPrice)}
                onChange={(e) => handlePriceChange('discount', e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
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
              {discountPrice && (
                <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                  <span className="text-sm text-gray-500">
                    -{priceCalculations.discountPercentage}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Guidelines */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center space-x-2">
            <AiOutlineInfoCircle className="text-blue-500" size={20} />
            <p className="text-sm text-blue-700">
              Minimum price for {productConfig.label}: £{minPrice}
            </p>
          </div>
          <div className="text-sm text-blue-600">
            Suggested price: £{priceCalculations.suggestedPrice}
          </div>
        </div>

        {/* Advanced Price Details */}
        {showAdvanced && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Price Breakdown</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Base Production Cost</p>
                  <p className="text-lg font-bold">£{(productConfig.basePrice - productConfig.designCost).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Design Cost</p>
                  <p className="text-lg font-bold">£{productConfig.designCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-lg font-bold">£{productConfig.basePrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Your Profit</p>
                  <p className="text-lg font-bold">£{priceCalculations.baseProfit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profit Margin</p>
                  <p className="text-lg font-bold">{priceCalculations.baseProfitPercentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Minimum Profit Required</p>
                  <p className="text-lg font-bold">£{priceCalculations.minimumProfit}</p>
                </div>
                {discountPrice && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Discounted Profit</p>
                      <p className="text-lg font-bold">£{priceCalculations.discountedProfit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Discounted Margin</p>
                      <p className="text-lg font-bold">{priceCalculations.discountedProfitPercentage}%</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Price History Chart could be added here */}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Final Price</p>
            <p className="text-xl font-bold text-gray-900">
              £{formatPrice(discountPrice || originalPrice)}
              {discountPrice && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  £{formatPrice(originalPrice)}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Profit per sale</p>
            <p className="text-xl font-bold text-gray-900">
              £{discountPrice ? priceCalculations.discountedProfit : priceCalculations.baseProfit}
              <span className="ml-2 text-sm text-gray-500">
                ({discountPrice ? priceCalculations.discountedProfitPercentage : priceCalculations.baseProfitPercentage}%)
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
    statusReason: product.statusReason || '',
    lastChecked: null
  });

  // Track mounted state
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Validation checks with detailed reporting
  const validateProduct = useCallback(async () => {
    const errors = {
      critical: [],
      warnings: [],
      suggestions: []
    };

    // Title validation
    const titleValidation = ValidationUtils.validateTitle(product.DesignTitle);
    if (!titleValidation.isValid) {
      errors.critical.push({
        field: 'title',
        message: titleValidation.error
      });
    }

    // Description validation
    const descriptionValidation = ValidationUtils.validateDescription(product.Description);
    if (!descriptionValidation.isValid) {
      errors.critical.push({
        field: 'description',
        message: descriptionValidation.error
      });
    } else if (product.Description.length < 50) {
      errors.suggestions.push({
        field: 'description',
        message: 'Consider adding a more detailed description for better visibility'
      });
    }

    // Price validation
    const priceValidation = ValidationUtils.validatePrice(
      product.originalPrice,
      product.ProductType
    );
    if (!priceValidation.isValid) {
      errors.critical.push({
        field: 'price',
        message: priceValidation.error
      });
    }

    if (product.discountPrice !== null && product.discountPrice !== undefined) {
      if (product.discountPrice >= product.originalPrice) {
        errors.critical.push({
          field: 'discountPrice',
          message: 'Discount price must be less than original price'
        });
      }
      const discountPercentage = ((product.originalPrice - product.discountPrice) / product.originalPrice) * 100;
      if (discountPercentage > 70) {
        errors.warnings.push({
          field: 'discountPrice',
          message: 'High discount percentage may affect perceived product value'
        });
      }
    }

    // Tags validation
    const tagsValidation = ValidationUtils.validateTags(product.Designtags);
    if (!tagsValidation.isValid) {
      errors.critical.push({
        field: 'tags',
        message: tagsValidation.error
      });
    } else if (product.Designtags.length < 3) {
      errors.suggestions.push({
        field: 'tags',
        message: 'Adding more relevant tags can improve product discoverability'
      });
    }

    // Main tag validation
    const mainTagValidation = ValidationUtils.validateMainTag(product.Maintag);
    if (!mainTagValidation.isValid) {
      errors.critical.push({
        field: 'mainTag',
        message: mainTagValidation.error
      });
    }

    // Design position validation
    const positionValidation = ValidationUtils.validateDesignPosition(
      product.DesignPosition,
      product.ProductType,
      product.ProductView
    );
    if (!positionValidation.isValid) {
      errors.critical.push({
        field: 'position',
        message: positionValidation.error
      });
    }

    // Design scale validation
    const scaleValidation = ValidationUtils.validateDesignScale(
      product.DesignScale,
      product.ProductType
    );
    if (!scaleValidation.isValid) {
      errors.critical.push({
        field: 'scale',
        message: scaleValidation.error
      });
    }

    // Design image validation
    try {
      const imageValid = await validateImageUrl(product.designImage);
      if (!imageValid) {
        errors.critical.push({
          field: 'designImage',
          message: 'Invalid or inaccessible design image'
        });
      }
    } catch (error) {
      errors.critical.push({
        field: 'designImage',
        message: 'Failed to validate design image'
      });
    }

    return errors;
  }, [product]);

  // Handle status change with validation
  const handleStatusChange = useCallback(async (newStatus, reason = '') => {
    if (disabled) return;

    setValidationState(prev => ({
      ...prev,
      isValidating: true,
      validationErrors: []
    }));

    try {
      const validationResults = await validateProduct();
      
      if (!isMounted.current) return;

      if (validationResults.critical.length > 0) {
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          validationErrors: validationResults.critical,
          lastChecked: new Date()
        }));
        onValidationComplete?.(false, validationResults);
        return;
      }

      // Show warnings if present
      if (validationResults.warnings.length > 0) {
        const proceed = window.confirm(
          `Warning: ${validationResults.warnings.map(w => w.message).join('\n\n')}\n\nDo you want to proceed?`
        );
        if (!proceed) {
          setValidationState(prev => ({
            ...prev,
            isValidating: false,
            validationErrors: [],
            lastChecked: new Date()
          }));
          return;
        }
      }

      // Show suggestions
      if (validationResults.suggestions.length > 0) {
        toast.info(
          <div>
            <strong>Suggestions for improvement:</strong>
            <ul className="mt-2 list-disc pl-4">
              {validationResults.suggestions.map((s, i) => (
                <li key={i}>{s.message}</li>
              ))}
            </ul>
          </div>,
          { autoClose: 8000 }
        );
      }

      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        currentStatus: newStatus,
        statusReason: reason,
        validationErrors: [],
        lastChecked: new Date()
      }));

      onStatusChange?.(newStatus, reason);
      onValidationComplete?.(true, validationResults);

    } catch (error) {
      if (!isMounted.current) return;

      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        validationErrors: [{
          field: 'system',
          message: 'Validation failed: ' + error.message
        }],
        lastChecked: new Date()
      }));
      onValidationComplete?.(false, { 
        critical: [{
          field: 'system',
          message: 'Validation failed: ' + error.message
        }],
        warnings: [],
        suggestions: []
      });
    }
  }, [disabled, validateProduct, onStatusChange, onValidationComplete]);

  // Group validation errors by type
  const groupedErrors = useMemo(() => {
    return validationState.validationErrors.reduce((acc, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field].push(error.message);
      return acc;
    }, {});
  }, [validationState.validationErrors]);

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
          {validationState.lastChecked && (
            <span className="text-sm text-gray-500">
              Last checked: {formatDate(validationState.lastChecked)}
            </span>
          )}
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
        {Object.keys(groupedErrors).length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-start">
              <AiOutlineWarning className="text-red-500 mt-0.5 mr-3" size={20} />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Validation Failed
                </h4>
                {Object.entries(groupedErrors).map(([field, messages]) => (
                  <div key={field} className="mb-2">
                    <h5 className="text-sm font-medium text-red-700 capitalize">
                      {field}:
                    </h5>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      {messages.map((message, index) => (
                        <li key={index}>{message}</li>
                      ))}
                    </ul>
                  </div>
                ))}
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
    _id: PropTypes.string.isRequired,
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

ValidationSystem.displayName = 'ValidationSystem';


const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { pendingProducts, loading, error } = useSelector((state) => state.product);
  
  const [editedProduct, setEditedProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchPendingProducts());
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };
    fetchData();

    return () => {
      debouncedSearch.cancel();
    };
  }, [dispatch, debouncedSearch]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(pendingProducts)) return [];

    return pendingProducts
      .filter(product => {
        if (!product) return false;
        
        const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
        const matchesSearch = !searchTerm || 
          (product.DesignTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [pendingProducts, filterStatus, searchTerm]);

  // Product selection handler
  const handleProductSelect = useCallback((product) => {
    if (!product) return;

    setSelectedProductId(product._id);
    setEditedProduct({
      ...product,
      DesignPosition: product.DesignPosition || { x: 50, y: 50 },
      DesignScale: product.DesignScale || 1,
      ProductView: product.ProductView || 'front'
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

  // Main tag update handler
  const handleMainTagUpdate = useCallback((newTag) => {
    if (!editedProduct || processingAction) return;

    setEditedProduct(prev => ({
      ...prev,
      Maintag: newTag
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
          ProductView: editedProduct.ProductView,
          Maintag: editedProduct.Maintag
        }
      })).unwrap();

      if (success) {
        toast.success(`Product ${newStatus === 'public' ? 'approved' : newStatus}`, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        setEditedProduct(null);
        setSelectedProductId(null);
        dispatch(fetchPendingProducts());
      }
    } catch (err) {
      toast.error(ErrorUtils.handleApiError(err), {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setProcessingAction(false);
    }
  }, [editedProduct, processingAction, dispatch]);


return (
    <ErrorBoundary>
      <div className={styles.section}>
        <div className="mb-8">
          <h1 className={styles.heading}>Product Approval Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Review and manage product submissions
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Product List Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header with Search and Filters */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Products {filteredProducts.length > 0 && `(${filteredProducts.length})`}
                  </h2>
                  {loading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                  )}
                </div>

                {/* Search Input */}
                <div className="mt-4 space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by title or shop name..."
                      onChange={(e) => debouncedSearch(e.target.value)}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Status Filters */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium transition-colors
                        ${filterStatus === 'all'
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                      `}
                    >
                      All
                    </button>
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status === filterStatus ? 'all' : status)}
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium transition-colors
                          ${filterStatus === status
                            ? config.color.replace('bg-', 'bg-opacity-100 ') + ' ' + config.textColor
                            : config.color.replace('bg-', 'bg-opacity-20 ') + ' ' + config.textColor.replace('text-', 'text-opacity-60 ')}
                        `}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product List */}
              {error ? (
                <div className="p-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex">
                      <AiOutlineWarning className="text-red-500 mt-0.5 mr-3" size={20} />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Error Loading Products</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !Array.isArray(pendingProducts) || filteredProducts.length === 0 ? (
                <div className="p-8 text-center">
                  {loading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-gray-200 h-20 rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <AiOutlineCheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                      <p className="text-gray-500">
                        {searchTerm 
                          ? 'No products match your search'
                          : filterStatus !== 'all'
                            ? `No ${filterStatus} products found`
                            : 'No products to review'
                        }
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleProductSelect(product)}
                      className={`
                        w-full p-4 text-left transition-colors duration-200 hover:bg-gray-50
                        ${selectedProductId === product._id ? 'bg-blue-50' : ''}
                      `}
                    >
                      <h3 className="font-medium text-gray-900 mb-1 truncate">
                        {product.DesignTitle || 'Untitled Design'}
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {PRODUCT_TYPES[product.ProductType]?.label || product.ProductType}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">
                            {COLOR_OPTIONS[product.ProductColor]?.label || product.ProductColor}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(product.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${STATUS_CONFIG[product.status || 'pending'].color.replace('bg-', 'bg-opacity-20 ')}
                          ${STATUS_CONFIG[product.status || 'pending'].textColor}
                        `}>
                          {STATUS_CONFIG[product.status || 'pending'].label}
                        </span>
                        {product.shop?.name && (
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">
                            {product.shop.name}
                          </span>
                        )}
                      </div>
                      {product.rejectionReason && (
                        <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                          Rejection reason: {product.rejectionReason}
                        </p>
                      )}
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
                {/* Product Metadata */}
                <ProductMetadata
                  product={editedProduct}
                  onMainTagChange={handleMainTagUpdate}
                  disabled={processingAction}
                />

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
                  {!loading && filteredProducts.length === 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setFilterStatus('all');
                          setSearchTerm('');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

AdminProductApproval.displayName = 'AdminProductApproval';

export default memo(AdminProductApproval);