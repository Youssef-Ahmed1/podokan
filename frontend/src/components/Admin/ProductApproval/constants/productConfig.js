// constants/productConfig.js

// Move all imports to the top
import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

// Define primitive constants first
const CLOUDINARY_URL = 'https://res.cloudinary.com/dkot9tyjm/image/upload';
const VIEWS = ['front', 'back'];
const COLORS = ['white', 'black'];
const BASE_PRICE = 850;
const PRODUCTION_COST = 650;
const DESIGN_COST = 200;

// Define base configurations
const BASE_POSITION = { x: 50, y: 40 };
const BASE_SCALE = 0.5;
const BASE_BOUNDARIES = {
  front: { x: [35, 65], y: [25, 45] },
  back: { x: [30, 70], y: [20, 50] }
};

// Define status configuration first as it's independent
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

// Create base product configuration
const BASE_PRODUCT_CONFIG = {
  basePrice: BASE_PRICE,
  productionCost: PRODUCTION_COST,
  designCost: DESIGN_COST,
  position: BASE_POSITION,
  scale: BASE_SCALE,
  margins: {
    min: 0.15,
    recommended: 0.30
  }
};

// Define product configurations
const PRODUCT_CONFIG = {
  hoodie: {
    ...BASE_PRODUCT_CONFIG,
    label: 'Hoodie',
    mockupConfig: {
      version: "v1728392918",
      folder: "hoodies",
      boundaries: BASE_BOUNDARIES
    }
  }
};

// Define derivative constants
const PRODUCT_TYPES = Object.keys(PRODUCT_CONFIG);
const AVAILABLE_COLORS = COLORS.map(color => ({
  name: color.charAt(0).toUpperCase() + color.slice(1),
  value: color
}));

// Utility functions
const getMockupUrl = (productType, color, view) => {
  if (!productType || !color || !view) return null;
  const config = PRODUCT_CONFIG[productType]?.mockupConfig;
  return config ? `${CLOUDINARY_URL}/${config.version}/${config.folder}/${productType}-${color}-${view}.png` : null;
};

// Exports
export {
  CLOUDINARY_URL,
  VIEWS,
  COLORS,
  AVAILABLE_COLORS,
  PRODUCT_CONFIG,
  PRODUCT_TYPES,
  STATUS_CONFIG,
  BASE_PRODUCT_CONFIG as DEFAULT_PRODUCT_CONFIG,
  getMockupUrl
};