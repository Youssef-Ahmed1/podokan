
// First define our imports 
import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

// Export individual constants first
export const CLOUDINARY_URL = 'https://res.cloudinary.com/dkot9tyjm/image/upload';
export const VIEWS = ['front', 'back'];
export const COLORS = ['white', 'black'];
export const BASE_PRICE = 850;
export const PRODUCTION_COST = 650;
export const DESIGN_COST = 200;
export const DEFAULT_POSITION = { x: 50, y: 40 };
export const DEFAULT_SCALE = 0.8;


// Define status config
export const STATUS_CONFIG = {
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
export const PRODUCT_CONFIG = {
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
export const PRODUCT_TYPES = Object.keys(PRODUCT_CONFIG);
export const AVAILABLE_COLORS = COLORS.map(value => ({
  name: value.charAt(0).toUpperCase() + value.slice(1),
  value
}));
export const AVAILABLE_TYPES = Object.entries(PRODUCT_CONFIG).map(([value, config]) => ({
  name: config.label,
  value
}));
 export const DEFAULT_PRODUCT_CONFIG = PRODUCT_CONFIG.hoodie;

// Define utility functions
export const getMockupUrl = (productType, color, view) => {
  try {
    const config = PRODUCT_CONFIG[productType]?.mockupConfig;
    if (!config) return null;
    return `${CLOUDINARY_URL}/${config.version}/${config.folder}/${productType}-${color}-${view}.png`;
  } catch (error) {
    console.error('Error generating mockup URL:', error);
    return null;
  }
};

export const isMockupAvailable = (productType, color, view) => {
  return COLORS.includes(color) && VIEWS.includes(view);
};

export const getAvailableColorsForProduct = () => AVAILABLE_COLORS;

export const getAvailableViews = () => VIEWS;

// Export everything
