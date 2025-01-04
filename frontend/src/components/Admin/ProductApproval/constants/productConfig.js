// frontend/src/components/Admin/ProductApproval/constants/productConfig.js

import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

// Base constants
const CLOUDINARY_URL = 'https://res.cloudinary.com/dkot9tyjm/image/upload';
const CLOUDINARY_VERSION = 'v1728392918';
const VIEWS = ['front', 'back'];
const COLORS = ['white', 'black'];

// Price configuration
const PRICE_CONFIG = {
  BASE_PRICE: 850,
  PRODUCTION_COST: 650,
  DESIGN_COST: 200,
  MARGINS: {
    min: 0.15,
    recommended: 0.30
  }
};

// Design constraints
const DESIGN_BOUNDARIES = {
  hoodie: {
    front: {
      x: { min: 35, max: 65 },
      y: { min: 25, max: 55 }
    },
    back: {
      x: { min: 35, max: 65 },
      y: { min: 25, max: 55 }
    }
  }
};

const DESIGN_SCALE = {
  min: 0.5,
  max: 1.2,
  default: 0.8
};

const DEFAULT_POSITION = { x: 50, y: 40 };

// Status configuration
const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    icon: HiClock,
    description: 'Awaiting admin review'
  },
  public: {
    label: 'Approved',
    color: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: HiCheck,
    description: 'Product is live and available for purchase'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    icon: HiX,
    description: 'Product has been rejected'
  },
  review: {
    label: 'In Review',
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: HiExclamation,
    description: 'Under detailed review'
  }
};

// Product configuration
const PRODUCT_CONFIG = {
  hoodie: {
    label: 'Hoodie',
    basePrice: PRICE_CONFIG.BASE_PRICE,
    productionCost: PRICE_CONFIG.PRODUCTION_COST,
    designCost: PRICE_CONFIG.DESIGN_COST,
    position: DEFAULT_POSITION,
    margins: PRICE_CONFIG.MARGINS,
    scale: DESIGN_SCALE,
    mockupConfig: {
      version: CLOUDINARY_VERSION,
      folder: "hoodies",
      boundaries: DESIGN_BOUNDARIES.hoodie
    }
  }
};

// Derived constants
const PRODUCT_TYPES = Object.keys(PRODUCT_CONFIG);

const AVAILABLE_COLORS = COLORS.map(value => ({
  name: value.charAt(0).toUpperCase() + value.slice(1),
  value,
  hex: value === 'white' ? '#ffffff' : '#000000',
  textColor: value === 'white' ? 'text-gray-800' : 'text-white'
}));

const AVAILABLE_TYPES = Object.entries(PRODUCT_CONFIG).map(([value, config]) => ({
  name: config.label,
  value
}));

// Default configuration
const DEFAULT_PRODUCT_CONFIG = PRODUCT_CONFIG.hoodie;

// Utility functions
const getMockupUrl = (productType, color, view) => {
  try {
    if (!productType || !color || !view) return null;
    if (!PRODUCT_TYPES.includes(productType)) return null;
    if (!COLORS.includes(color)) return null;
    if (!VIEWS.includes(view)) return null;

    const config = PRODUCT_CONFIG[productType]?.mockupConfig;
    if (!config) return null;

    return `${CLOUDINARY_URL}/${config.version}/${config.folder}/${productType}-${color}-${view}.png`;
  } catch (error) {
    console.error('Error generating mockup URL:', error);
    return null;
  }
};

const validateDesignPosition = (position, productType, view = 'front') => {
  if (!PRODUCT_TYPES.includes(productType)) return { isValid: false, boundaries: null };
  
  const boundaries = DESIGN_BOUNDARIES[productType]?.[view];
  if (!boundaries) return { isValid: false, boundaries: null };

  const isValid = 
    position.x >= boundaries.x.min && 
    position.x <= boundaries.x.max && 
    position.y >= boundaries.y.min && 
    position.y <= boundaries.y.max;

  return { isValid, boundaries };
};

const isMockupAvailable = (productType, color, view) => {
  return (
    PRODUCT_TYPES.includes(productType) &&
    COLORS.includes(color) &&
    VIEWS.includes(view)
  );
};

const getAvailableColorsForProduct = (productType) => {
  if (!PRODUCT_TYPES.includes(productType)) return [];
  return AVAILABLE_COLORS;
};

const getAvailableViews = (productType) => {
  if (!PRODUCT_TYPES.includes(productType)) return [];
  return VIEWS;
};

const getProductConfig = (productType) => {
  return PRODUCT_CONFIG[productType] || DEFAULT_PRODUCT_CONFIG;
};

export {
  // Constants
  CLOUDINARY_URL,
  CLOUDINARY_VERSION,
  VIEWS,
  COLORS,
  PRODUCT_TYPES,
  AVAILABLE_COLORS,
  AVAILABLE_TYPES,
  PRODUCT_CONFIG,
  DEFAULT_PRODUCT_CONFIG,
  STATUS_CONFIG,
  PRICE_CONFIG,
  DESIGN_BOUNDARIES,
  DESIGN_SCALE,
  DEFAULT_POSITION,
  
  // Utility Functions
  getMockupUrl,
  isMockupAvailable,
  getAvailableColorsForProduct,
  getAvailableViews,
  validateDesignPosition,
  getProductConfig
};