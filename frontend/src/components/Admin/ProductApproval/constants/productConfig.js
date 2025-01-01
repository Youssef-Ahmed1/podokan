// Module-level constants
const CLOUDINARY_URL = 'https://res.cloudinary.com/dkot9tyjm/image/upload';
const VIEWS = ['front', 'back'];
const COLORS = ['white', 'black'];

// Immediately Invoked Function Expression (IIFE) to encapsulate configuration
const CONFIG = (function() {
  // Status configurations
  const statusConfig = {
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

  // Product configurations
  const productConfig = {
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

  return {
    statusConfig,
    productConfig,
    defaultConfig: {
      position: { x: 50, y: 40 },
      scale: 0.5
    }
  };
})();

// Utility functions - defined after configurations
const utils = {
  getFilename: (productType, color, view) => {
    return `${productType}-${color}-${view}`;
  },

  getMockupUrl: (productType, color, view) => {
    try {
      const config = CONFIG.productConfig[productType]?.mockupConfig;
      if (!config) return null;
      return `${CLOUDINARY_URL}/${config.version}/${config.folder}/${utils.getFilename(productType, color, view)}.png`;
    } catch (error) {
      console.error('Error generating mockup URL:', error);
      return null;
    }
  },

  isMockupAvailable: (productType, color, view) => {
    return COLORS.includes(color) && VIEWS.includes(view);
  },

  getAvailableColorsForProduct: () => {
    return COLORS.map(value => ({
      name: value.charAt(0).toUpperCase() + value.slice(1),
      value
    }));
  },

  getAvailableViews: () => VIEWS
};

// Export everything
export const productConfig = {
  CLOUDINARY_BASE: CLOUDINARY_URL,
  VIEWS,
  COLORS,
  AVAILABLE_COLORS: utils.getAvailableColorsForProduct(),
  PRODUCT_CONFIG: CONFIG.productConfig,
  PRODUCT_TYPES: Object.keys(CONFIG.productConfig),
  STATUS_CONFIG: CONFIG.statusConfig,
  AVAILABLE_TYPES: Object.entries(CONFIG.productConfig).map(([value, config]) => ({
    name: config.label,
    value
  })),
  DEFAULT_PRODUCT_CONFIG: {
    ...CONFIG.productConfig.hoodie,
    position: CONFIG.defaultConfig.position,
    scale: CONFIG.defaultConfig.scale,
  },
  getMockupUrl: utils.getMockupUrl,
  isMockupAvailable: utils.isMockupAvailable,
  getAvailableColorsForProduct: utils.getAvailableColorsForProduct,
  getAvailableViews: utils.getAvailableViews
};

// Default export
export default productConfig;