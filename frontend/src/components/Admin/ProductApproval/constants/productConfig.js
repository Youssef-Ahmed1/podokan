import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

// First, declare all primitive constants that don't depend on anything else
const CLOUDINARY_BASE = 'https://res.cloudinary.com/dkot9tyjm/image/upload';
const BASE_VIEWS = ['front', 'back'];
const BASE_COLORS = ['white', 'black'];

// Create a wrapper function to initialize all configurations
const initializeConfigs = () => {
  // Helper function to create mockup config
  const createMockupConfig = (version, folder) => ({
    version,
    folder,
    getFilename: (color, view) => `hoodie-${color}-${view}`,
    availableColors: BASE_COLORS,
    views: BASE_VIEWS,
    boundaries: {
      front: { x: [35, 65], y: [25, 45] },
      back: { x: [30, 70], y: [20, 50] }
    }
  });

  // Define the base product configuration
  const productConfig = {
    'hoodie': {
      label: 'Hoodie',
      basePrice: 850,
      productionCost: 650,
      designCost: 200,
      margins: {
        min: 0.15,
        recommended: 0.30
      },
      mockupConfig: createMockupConfig("v1728392918", "hoodies")
    }
  };

  const statusConfig = {
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

  const availableColors = [
    { name: 'White', value: 'white' },
    { name: 'Black', value: 'black' }
  ];

  const defaultProductConfig = {
    label: 'Hoodie',
    basePrice: 850,
    productionCost: 650,
    designCost: 200,
    position: { x: 50, y: 40 },
    margins: {
      min: 0.15,
      recommended: 0.30
    },
    scale: 0.5,
    mockupConfig: {
      availableColors: BASE_COLORS,
      views: BASE_VIEWS,
      boundaries: {
        front: { x: [35, 65], y: [40, 55] },
        back: { x: [30, 70], y: [20, 50] }
      }
    }
  };

  // Create utility functions
  const utils = {
    getMockupUrl: (productType, color, view) => {
      try {
        const config = productConfig[productType]?.mockupConfig;
        if (!config) return null;
        return `${CLOUDINARY_BASE}/${config.version}/${config.folder}/${config.getFilename(color, view)}.png`;
      } catch (error) {
        console.error('Error generating mockup URL:', error);
        return null;
      }
    },

    isMockupAvailable: (productType, color, view) => {
      const config = productConfig[productType]?.mockupConfig;
      if (!config) return false;
      return config.availableColors.includes(color) && config.views.includes(view);
    },

    getAvailableColorsForProduct: (productType) => {
      const colors = productConfig[productType]?.mockupConfig?.availableColors || BASE_COLORS;
      return availableColors.filter(color => colors.includes(color.value));
    },

    getAvailableViews: (productType) => {
      return productConfig[productType]?.mockupConfig?.views || BASE_VIEWS;
    }
  };

  return {
    PRODUCT_CONFIG: productConfig,
    PRODUCT_TYPES: Object.keys(productConfig),
    AVAILABLE_TYPES: Object.entries(productConfig).map(([value, config]) => ({
      name: config.label,
      value
    })),
    STATUS_CONFIG: statusConfig,
    DEFAULT_PRODUCT_CONFIG: defaultProductConfig,
    AVAILABLE_COLORS: availableColors,
    VIEWS: BASE_VIEWS,
    ...utils
  };
};

// Export all configurations and utilities
const {
  PRODUCT_CONFIG,
  PRODUCT_TYPES,
  AVAILABLE_TYPES,
  STATUS_CONFIG,
  DEFAULT_PRODUCT_CONFIG,
  AVAILABLE_COLORS,
  VIEWS,
  getMockupUrl,
  isMockupAvailable,
  getAvailableColorsForProduct,
  getAvailableViews
} = initializeConfigs();

export {
  CLOUDINARY_BASE,
  PRODUCT_CONFIG,
  PRODUCT_TYPES,
  AVAILABLE_TYPES,
  STATUS_CONFIG,
  DEFAULT_PRODUCT_CONFIG,
  AVAILABLE_COLORS,
  VIEWS,
  getMockupUrl,
  isMockupAvailable,
  getAvailableColorsForProduct,
  getAvailableViews
};