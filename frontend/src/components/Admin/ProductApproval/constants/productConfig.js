// constants/productConfig.js

// First define our imports 
import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

// Base constants defined first
const CLOUDINARY_URL = 'https://res.cloudinary.com/dkot9tyjm/image/upload';
const VIEWS = ['front', 'back'];
const COLORS = ['white', 'black'];
const BASE_PRICE = 850;
const PRODUCTION_COST = 650;
const DESIGN_COST = 200;
const DEFAULT_POSITION = { x: 50, y: 40 };
const DEFAULT_SCALE = 0.5;

// Define status config
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

// Define product config
const PRODUCT_CONFIG = {
  hoodie: {
    label: 'Hoodie',
    basePrice: BASE_PRICE,
    productionCost: PRODUCTION_COST,
    designCost: DESIGN_COST,
    position: DEFAULT_POSITION,
    margins: {
      min: 0.15,
      recommended: 0.30
    },
    scale: DEFAULT_SCALE,
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

// Define derivative constants
const PRODUCT_TYPES = Object.keys(PRODUCT_CONFIG);
const AVAILABLE_COLORS = COLORS.map(value => ({
  name: value.charAt(0).toUpperCase() + value.slice(1),
  value
}));
const AVAILABLE_TYPES = Object.entries(PRODUCT_CONFIG).map(([value, config]) => ({
  name: config.label,
  value
}));
const DEFAULT_PRODUCT_CONFIG = PRODUCT_CONFIG.hoodie;

// Define utility functions
const getMockupUrl = (productType, color, view) => {
  try {
    const config = PRODUCT_CONFIG[productType]?.mockupConfig;
    if (!config) return null;
    return `${CLOUDINARY_URL}/${config.version}/${config.folder}/${productType}-${color}-${view}.png`;
  } catch (error) {
    console.error('Error generating mockup URL:', error);
    return null;
  }
};

const isMockupAvailable = (productType, color, view) => {
  return COLORS.includes(color) && VIEWS.includes(view);
};

const getAvailableColorsForProduct = () => AVAILABLE_COLORS;

const getAvailableViews = () => VIEWS;

// Export everything
export {
  CLOUDINARY_URL,
  VIEWS,
  COLORS,
  AVAILABLE_COLORS,
  PRODUCT_CONFIG,
  PRODUCT_TYPES,
  STATUS_CONFIG,
  AVAILABLE_TYPES,
  DEFAULT_PRODUCT_CONFIG,
  getMockupUrl,
  isMockupAvailable,
  getAvailableColorsForProduct,
  getAvailableViews
};