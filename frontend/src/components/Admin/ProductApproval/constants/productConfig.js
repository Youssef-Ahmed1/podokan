// constants.js
const createConstants = () => {
  // Base constants
  const BASE = {
    CLOUDINARY_URL: 'https://res.cloudinary.com/dkot9tyjm/image/upload',
    VIEWS: ['front', 'back'],
    COLORS: ['white', 'black'],
    BASE_PRICE: 850,
    PRODUCTION_COST: 650,
    DESIGN_COST: 200
  };

  // Helper functions
  const helpers = {
    createMockupConfig: (version, folder) => ({
      version,
      folder,
      getFilename: (color, view) => `${folder}-${color}-${view}`,
      availableColors: BASE.COLORS,
      views: BASE.VIEWS,
      boundaries: {
        front: { x: [35, 65], y: [25, 45] },
        back: { x: [30, 70], y: [20, 50] }
      }
    }),
    
    createProductConfig: (label, mockupConfig) => ({
      label,
      basePrice: BASE.BASE_PRICE,
      productionCost: BASE.PRODUCTION_COST,
      designCost: BASE.DESIGN_COST,
      margins: {
        min: 0.15,
        recommended: 0.30
      },
      mockupConfig
    })
  };

  // Configurations
  const configs = {
    products: {
      hoodie: helpers.createProductConfig(
        'Hoodie',
        helpers.createMockupConfig("v1728392918", "hoodies")
      )
    },
    
    status: {
      pending: {
        label: 'Pending Review',
        color: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: 'HiClock',
        description: 'Awaiting admin review'
      },
      public: {
        label: 'Approved',
        color: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: 'HiCheck',
        description: 'Product is live and available for purchase'
      },
      rejected: {
        label: 'Rejected',
        color: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        icon: 'HiX',
        description: 'Product has been rejected'
      },
      review: {
        label: 'In Review',
        color: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        icon: 'HiExclamation',
        description: 'Under detailed review'
      }
    }
  };

  // Utility functions that use the configurations
  const utils = {
    getMockupUrl: (productType, color, view) => {
      const config = configs.products[productType]?.mockupConfig;
      if (!config) return null;
      return `${BASE.CLOUDINARY_URL}/${config.version}/${config.folder}/${config.getFilename(color, view)}.png`;
    },

    isMockupAvailable: (productType, color, view) => {
      const config = configs.products[productType]?.mockupConfig;
      if (!config) return false;
      return config.availableColors.includes(color) && config.views.includes(view);
    },

    getAvailableColors: (productType) => {
      const colors = configs.products[productType]?.mockupConfig?.availableColors || BASE.COLORS;
      return colors.map(value => ({ name: value.charAt(0).toUpperCase() + value.slice(1), value }));
    },

    getAvailableViews: (productType) => {
      return configs.products[productType]?.mockupConfig?.views || BASE.VIEWS;
    }
  };

  // Return everything in a single object to avoid initialization order issues
  return {
    CLOUDINARY_BASE: BASE.CLOUDINARY_URL,
    VIEWS: BASE.VIEWS,
    COLORS: BASE.COLORS,
    PRODUCT_CONFIG: configs.products,
    PRODUCT_TYPES: Object.keys(configs.products),
    STATUS_CONFIG: configs.status,
    AVAILABLE_TYPES: Object.entries(configs.products).map(([value, config]) => ({
      name: config.label,
      value
    })),
    ...utils
  };
};

// Create and export all constants and utilities
const {
  CLOUDINARY_BASE,
  VIEWS,
  COLORS,
  PRODUCT_CONFIG,
  PRODUCT_TYPES,
  STATUS_CONFIG,
  AVAILABLE_TYPES,
  getMockupUrl,
  isMockupAvailable,
  getAvailableColors,
  getAvailableViews
} = createConstants();

export {
  CLOUDINARY_BASE,
  VIEWS,
  COLORS,
  PRODUCT_CONFIG,
  PRODUCT_TYPES,
  STATUS_CONFIG,
  AVAILABLE_TYPES,
  getMockupUrl,
  isMockupAvailable,
  getAvailableColors,
  getAvailableViews
};