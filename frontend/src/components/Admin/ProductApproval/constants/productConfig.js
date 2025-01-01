import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

// First, define all constants that don't depend on other declarations
export const CLOUDINARY_BASE = 'https://res.cloudinary.com/dkot9tyjm/image/upload';

export const VIEWS = ['front', 'back'];

export const AVAILABLE_COLORS = [
  { name: 'White', value: 'white' },
  { name: 'Black', value: 'black' }
];

// Define the base configurations first
export const PRODUCT_CONFIG = {
  'hoodie': {
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
      getFilename: (color, view) => `hoodie-${color}-${view}`,
      availableColors: ['white', 'black'],
      views: ['front', 'back'],
      boundaries: {
        front: { x: [35, 65], y: [25, 45] },
        back: { x: [30, 70], y: [20, 50] }
      }
    }
  }
};

// Then define dependent constants
export const PRODUCT_TYPES = Object.keys(PRODUCT_CONFIG);

export const AVAILABLE_TYPES = Object.entries(PRODUCT_CONFIG).map(([value, config]) => ({
  name: config.label,
  value
}));

export const DEFAULT_PRODUCT_CONFIG = {
  label: 'Hoodie',
  basePrice: 850,
  productionCost: 650,
  designCost: 200,
  position: { x: 50, y: 40 },
  margins: {
    min: 0.15,
    recommended: 0.30
  },
  scale: 0.8,
  mockupConfig: {
    availableColors: ['white', 'black'],
    views: ['front', 'back'],
    boundaries: {
      front: { x: [35, 65], y: [40, 55] },
      back: { x: [30, 70], y: [20, 50] }
    }
  }
};

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

// Define utility functions last, after all configs are defined
export const getMockupUrl = (productType, color, view) => {
  try {
    const config = PRODUCT_CONFIG[productType]?.mockupConfig;
    if (!config) return null;
    return `${CLOUDINARY_BASE}/${config.version}/${config.folder}/${config.getFilename(color, view)}.png`;
  } catch (error) {
    console.error('Error generating mockup URL:', error);
    return null;
  }
};

export const isMockupAvailable = (productType, color, view) => {
  const config = PRODUCT_CONFIG[productType]?.mockupConfig;
  if (!config) return false;
  return config.availableColors.includes(color) && config.views.includes(view);
};

export const getAvailableColorsForProduct = (productType) => {
  const colors = PRODUCT_CONFIG[productType]?.mockupConfig?.availableColors || ['white', 'black'];
  return AVAILABLE_COLORS.filter(color => colors.includes(color.value));
};

export const getAvailableViews = (productType) => {
  return PRODUCT_CONFIG[productType]?.mockupConfig?.views || VIEWS;
};