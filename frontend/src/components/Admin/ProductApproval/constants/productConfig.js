// productConfig.js

// Module-level constants
const CLOUDINARY_URL = 'https://res.cloudinary.com/dkot9tyjm/image/upload';
const VIEWS = ['front', 'back'];
const COLORS = ['white', 'black'];

// Product configurations
const PRODUCT_CONFIG = {
  hoodie: {
    label: 'Hoodie',
    basePrice: 850,
    productionCost: 650,
    designCost: 200,
    margins: {
      min: 0.15,
      recommended: 0.30
    },
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

// Derive product types from config
export const PRODUCT_TYPES = Object.keys(PRODUCT_CONFIG);

// Status configurations
const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    description: 'Awaiting admin review'
  },
  public: {
    label: 'Approved',
    color: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    description: 'Product is live and available for purchase'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    description: 'Product has been rejected'
  },
  review: {
    label: 'In Review',
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    description: 'Under detailed review'
  }
};

// Default configuration
const DEFAULT_CONFIG = {
  position: { x: 50, y: 40 },
  scale: 0.5
};

// Utility functions
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

const getAvailableColorsForProduct = () => {
  return COLORS.map(value => ({
    name: value.charAt(0).toUpperCase() + value.slice(1),
    value
  }));
};

const getAvailableViews = () => VIEWS;

// Export named constants and functions individually
export {
  CLOUDINARY_URL as CLOUDINARY_BASE,
  VIEWS,
  COLORS,
  PRODUCT_CONFIG,
  STATUS_CONFIG,
  getMockupUrl,
  isMockupAvailable,
  getAvailableColorsForProduct,
  getAvailableViews
};

// Export derived constants
export const AVAILABLE_COLORS = getAvailableColorsForProduct();
export const AVAILABLE_TYPES = Object.entries(PRODUCT_CONFIG).map(([value, config]) => ({
  name: config.label,
  value
}));
export const DEFAULT_PRODUCT_CONFIG = {
  ...PRODUCT_CONFIG.hoodie,
  position: DEFAULT_CONFIG.position,
  scale: DEFAULT_CONFIG.scale,
};

// Default export for convenience
export default {
  CLOUDINARY_BASE: CLOUDINARY_URL,
  VIEWS,
  COLORS,
  PRODUCT_TYPES,
  PRODUCT_CONFIG,
  STATUS_CONFIG,
  AVAILABLE_COLORS,
  AVAILABLE_TYPES,
  DEFAULT_PRODUCT_CONFIG,
  getMockupUrl,
  isMockupAvailable,
  getAvailableColorsForProduct,
  getAvailableViews
};