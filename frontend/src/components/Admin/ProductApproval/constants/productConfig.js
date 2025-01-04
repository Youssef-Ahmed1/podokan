// frontend/src/components/Admin/ProductApproval/constants/productConfig.js

import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

// Cloudinary configuration for mockup images
const CLOUDINARY_URL = 'https://res.cloudinary.com/dkot9tyjm/image/upload';
const CLOUDINARY_VERSION = 'v1728392918';

// Product view options
const VIEWS = ['front', 'back'];

// Available product colors
const COLORS = ['white', 'black'];

// Design placement and scaling constraints
// These values control where designs can be placed on products
const DESIGN_BOUNDARIES = {
  hoodie: {
    front: {
      x: { min: 35, max: 65 }, // Percentage from left
      y: { min: 25, max: 55 }  // Percentage from top - adjusted to avoid pocket
    },
    back: {
      x: { min: 35, max: 65 },
      y: { min: 25, max: 55 }
    }
  }
};

// Design scale constraints
const DESIGN_SCALE = {
  min: 0.5,
  max: 1.2,
  default: 0.8
};

// Default positioning for new designs
const DEFAULT_POSITION = {
  x: 50,  // Center horizontally
  y: 40   // Slightly above center vertically
};

// Product status configurations
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
  }
};

// Main product configuration
const PRODUCT_CONFIG = {
  hoodie: {
    label: 'Hoodie',
    mockupConfig: {
      folder: "hoodies",
      boundaries: DESIGN_BOUNDARIES.hoodie,
      defaultPosition: DEFAULT_POSITION,
      scale: DESIGN_SCALE
    }
  }
};

// Helper functions for design position validation
const validateDesignPosition = (position, productType, view = 'front') => {
  const boundaries = DESIGN_BOUNDARIES[productType]?.[view];
  if (!boundaries) return { isValid: false, boundaries: null };

  const isValid = 
    position.x >= boundaries.x.min && 
    position.x <= boundaries.x.max && 
    position.y >= boundaries.y.min && 
    position.y <= boundaries.y.max;

  return { isValid, boundaries };
};

// Helper function for mockup URLs
const getMockupUrl = (productType, color, view) => {
  if (!productType || !color || !view) return null;
  if (!PRODUCT_CONFIG[productType]) return null;
  if (!COLORS.includes(color)) return null;
  if (!VIEWS.includes(view)) return null;

  return `${CLOUDINARY_URL}/${CLOUDINARY_VERSION}/${productType}s/${productType}-${color}-${view}.png`;
};

// Color configuration with display properties
const AVAILABLE_COLORS = COLORS.map(color => ({
  value: color,
  label: color.charAt(0).toUpperCase() + color.slice(1),
  hex: color === 'white' ? '#ffffff' : '#000000',
  textColor: color === 'white' ? 'text-gray-800' : 'text-white'
}));

// Product type configuration for UI
const AVAILABLE_TYPES = Object.entries(PRODUCT_CONFIG).map(([value, config]) => ({
  value,
  label: config.label
}));

export {
  // Constants
  CLOUDINARY_URL,
  CLOUDINARY_VERSION,
  VIEWS,
  COLORS,
  AVAILABLE_COLORS,
  AVAILABLE_TYPES,
  DESIGN_BOUNDARIES,
  DESIGN_SCALE,
  DEFAULT_POSITION,
  STATUS_CONFIG,
  PRODUCT_CONFIG,
  
  // Helper functions
  validateDesignPosition,
  getMockupUrl
};