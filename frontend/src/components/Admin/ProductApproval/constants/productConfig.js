// constants/productConfig.js

// Imports
import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

// Base Constants
const CLOUDINARY_URL = 'https://res.cloudinary.com/dkot9tyjm/image/upload';
const VIEWS = ['front', 'back'];
const COLORS = ['white', 'black'];
const BASE_PRICE = 850;
const PRODUCTION_COST = 650;
const DESIGN_COST = 200;

// Design Area Constants
const DESIGN_AREAS = {
  hoodie: {
    front: {
      defaultPosition: { x: 50, y: 40 },
      bounds: { x: [35, 65], y: [25, 45] },
      defaultScale: 1
    },
    back: {
      defaultPosition: { x: 50, y: 40 },
      bounds: { x: [30, 70], y: [20, 50] },
      defaultScale: 1
    }
  },
  tshirt: {
    front: {
      defaultPosition: { x: 50, y: 40 },
      bounds: { x: [35, 65], y: [25, 45] },
      defaultScale: 1
    },
    back: {
      defaultPosition: { x: 50, y: 40 },
      bounds: { x: [30, 70], y: [20, 50] },
      defaultScale: 1
    }
  }
};

// Product Size Chart
const SIZE_CHART = {
  hoodie: {
    S: { chest: "36-38", length: "27", sleeve: "33" },
    M: { chest: "40-42", length: "28", sleeve: "34" },
    L: { chest: "44-46", length: "29", sleeve: "35" },
    XL: { chest: "48-50", length: "30", sleeve: "36" },
    XXL: { chest: "52-54", length: "31", sleeve: "37" }
  },
  tshirt: {
    S: { chest: "34-36", length: "26", sleeve: "16" },
    M: { chest: "38-40", length: "27", sleeve: "17" },
    L: { chest: "42-44", length: "28", sleeve: "18" },
    XL: { chest: "46-48", length: "29", sleeve: "19" },
    XXL: { chest: "50-52", length: "30", sleeve: "20" }
  }
};

// Product Status Configuration
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
  restricted: {
    label: 'Restricted',
    color: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    icon: HiExclamation,
    description: 'Product is restricted to seller only'
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

// Base Product Configuration
const BASE_PRODUCT_CONFIG = {
  basePrice: BASE_PRICE,
  productionCost: PRODUCTION_COST,
  designCost: DESIGN_COST,
  margins: {
    min: 0.15,
    recommended: 0.30
  },
  mockupVersion: "v1728392918"
};

// Available Colors Configuration
const AVAILABLE_COLORS = COLORS.map(color => ({
  name: color.charAt(0).toUpperCase() + color.slice(1),
  value: color,
  hex: color === 'white' ? '#FFFFFF' : '#000000'
}));

// Product Types Configuration
const PRODUCT_TYPES = {
  hoodie: {
    ...BASE_PRODUCT_CONFIG,
    label: 'Hoodie',
    category: 'Apparel',
    sizeChart: SIZE_CHART.hoodie,
    designAreas: DESIGN_AREAS.hoodie,
    mockupConfig: {
      version: BASE_PRODUCT_CONFIG.mockupVersion,
      folder: "hoodies",
      boundaries: DESIGN_AREAS.hoodie
    },
    variants: {
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: AVAILABLE_COLORS
    },
    printAreas: {
      front: {
        width: 12,
        height: 16,
        position: 'center'
      },
      back: {
        width: 14,
        height: 18,
        position: 'center'
      }
    }
  },
  tshirt: {
    ...BASE_PRODUCT_CONFIG,
    label: 'T-Shirt',
    category: 'Apparel',
    sizeChart: SIZE_CHART.tshirt,
    designAreas: DESIGN_AREAS.tshirt,
    mockupConfig: {
      version: BASE_PRODUCT_CONFIG.mockupVersion,
      folder: "tshirts",
      boundaries: DESIGN_AREAS.tshirt
    },
    variants: {
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: AVAILABLE_COLORS
    },
    printAreas: {
      front: {
        width: 10,
        height: 14,
        position: 'center'
      },
      back: {
        width: 12,
        height: 16,
        position: 'center'
      }
    }
  }
};
const getAvailableColorsForProduct = () => AVAILABLE_COLORS;
// Utility Functions
const getMockupUrl = (productType, color, view) => {
  if (!productType || !color || !view) return null;
  const config = PRODUCT_TYPES[productType]?.mockupConfig;
  return config 
    ? `${CLOUDINARY_URL}/${config.version}/${config.folder}/${productType}-${color}-${view}.png`
    : null;
};

const getDesignArea = (productType, view) => {
  return DESIGN_AREAS[productType]?.[view] || DESIGN_AREAS.hoodie.front;
};

const calculatePrice = (basePrice, margin = BASE_PRODUCT_CONFIG.margins.recommended) => {
  return Math.round(basePrice * (1 + margin));
};

const validateDesignPosition = (position, productType, view) => {
  const area = getDesignArea(productType, view);
  const { bounds } = area;
  
  return {
    x: Math.max(bounds.x[0], Math.min(bounds.x[1], position.x)),
    y: Math.max(bounds.y[0], Math.min(bounds.y[1], position.y))
  };
};

const isMockupAvailable = (productType, color, view) => {
  return COLORS.includes(color) && VIEWS.includes(view);
};
 const getAvailableViews = () => VIEWS;
 const AVAILABLE_TYPES = Object.entries(PRODUCT_CONFIG).map(([value, config]) => ({
  name: config.label,
  value
}));
// Exports
export {
  CLOUDINARY_URL,
  VIEWS,
  COLORS,
  AVAILABLE_COLORS,
  PRODUCT_TYPES,
  STATUS_CONFIG,
  BASE_PRODUCT_CONFIG as DEFAULT_PRODUCT_CONFIG,
  SIZE_CHART,
  DESIGN_AREAS,
  getMockupUrl,
  getDesignArea,
  calculatePrice,
  validateDesignPosition,
  getAvailableColorsForProduct,
  isMockupAvailable,
  getAvailableViews,
  AVAILABLE_TYPES,
};