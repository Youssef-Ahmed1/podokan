// productConfig.js

import { HiCheck, HiClock, HiX, HiExclamation } from 'react-icons/hi';

// Base constants
const BASE_CONFIG = {
  CLOUDINARY_URL: 'https://res.cloudinary.com/dkot9tyjm/image/upload',
  VIEWS: ['front', 'back'],
  COLORS: ['white', 'black'],
  PRICE: {
    BASE: 850,
    PRODUCTION: 650,
    DESIGN: 200
  },
  POSITION: {
    DEFAULT: { x: 50, y: 40 },
    SCALE: 0.5
  }
};

// Product configurations
const PRODUCT_CONFIG = {
  hoodie: {
    label: 'Hoodie',
    basePrice: BASE_CONFIG.PRICE.BASE,
    productionCost: BASE_CONFIG.PRICE.PRODUCTION,
    designCost: BASE_CONFIG.PRICE.DESIGN,
    position: BASE_CONFIG.POSITION.DEFAULT,
    scale: BASE_CONFIG.POSITION.SCALE,
    mockupConfig: {
      version: "v1728392918",
      folder: "hoodies",
      boundaries: {
        front: { x: [35, 65], y: [25, 45] },
        back: { x: [30, 70], y: [20, 50] }
      }
    }
  }
};

// Status configurations
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

// Derived constants
const AVAILABLE_COLORS = BASE_CONFIG.COLORS.map(value => ({
  name: value.charAt(0).toUpperCase() + value.slice(1),
  value
}));

const AVAILABLE_TYPES = Object.entries(PRODUCT_CONFIG).map(([value, config]) => ({
  name: config.label,
  value
}));

const PRODUCT_TYPES = Object.keys(PRODUCT_CONFIG);

// Utility functions
const getMockupUrl = (productType, color, view) => {
  try {
    const config = PRODUCT_CONFIG[productType]?.mockupConfig;
    if (!config) return null;
    return `${BASE_CONFIG.CLOUDINARY_URL}/${config.version}/${config.folder}/${productType}-${color}-${view}.png`;
  } catch (error) {
    console.error('Error generating mockup URL:', error);
    return null;
  }
};

const isMockupAvailable = (productType, color, view) => {
  return BASE_CONFIG.COLORS.includes(color) && BASE_CONFIG.VIEWS.includes(view);
};

const getAvailableColorsForProduct = () => AVAILABLE_COLORS;

const getAvailableViews = () => BASE_CONFIG.VIEWS;

// Exports
export {
  BASE_CONFIG as CLOUDINARY_BASE,
  BASE_CONFIG.VIEWS as VIEWS,
  BASE_CONFIG.COLORS as COLORS,
  AVAILABLE_COLORS,
  PRODUCT_CONFIG,
  PRODUCT_TYPES,
  STATUS_CONFIG,
  AVAILABLE_TYPES,
  PRODUCT_CONFIG.hoodie as DEFAULT_PRODUCT_CONFIG,
  getMockupUrl,
  isMockupAvailable,
  getAvailableColorsForProduct,
  getAvailableViews
};

export default {
  CLOUDINARY_BASE: BASE_CONFIG.CLOUDINARY_URL,
  VIEWS: BASE_CONFIG.VIEWS,
  COLORS: BASE_CONFIG.COLORS,
  AVAILABLE_COLORS,
  PRODUCT_CONFIG,
  PRODUCT_TYPES,
  STATUS_CONFIG,
  AVAILABLE_TYPES,
  DEFAULT_PRODUCT_CONFIG: PRODUCT_CONFIG.hoodie,
  getMockupUrl,
  isMockupAvailable,
  getAvailableColorsForProduct,
  getAvailableViews
};