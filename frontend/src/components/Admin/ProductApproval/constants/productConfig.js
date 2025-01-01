import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

const ProductConfig = () => {
  // Base constants that don't depend on anything
  const BASE = {
    CLOUDINARY_URL: 'https://res.cloudinary.com/dkot9tyjm/image/upload',
    VIEWS: ['front', 'back'],
    COLORS: ['white', 'black'],
    BASE_PRICE: 850,
    PRODUCTION_COST: 650,
    DESIGN_COST: 200,
    DEFAULT_POSITION: { x: 50, y: 40 },
    DEFAULT_SCALE: 0.5
  };

  // Color configurations
  const AVAILABLE_COLORS = [
    { name: 'White', value: 'white' },
    { name: 'Black', value: 'black' }
  ];

  // Helper functions
  const createMockupConfig = (version, folder) => ({
    version,
    folder,
    getFilename: (color, view) => `${folder}-${color}-${view}`,
    availableColors: BASE.COLORS,
    views: BASE.VIEWS,
    boundaries: {
      front: { x: [35, 65], y: [25, 45] },
      back: { x: [30, 70], y: [20, 50] }
    }
  });

  const createProductConfig = (label, mockupConfig) => ({
    label,
    basePrice: BASE.BASE_PRICE,
    productionCost: BASE.PRODUCTION_COST,
    designCost: BASE.DESIGN_COST,
    position: BASE.DEFAULT_POSITION,
    margins: {
      min: 0.15,
      recommended: 0.30
    },
    scale: BASE.DEFAULT_SCALE,
    mockupConfig
  });

  // Product configurations
  const PRODUCT_CONFIG = {
    'hoodie': createProductConfig(
      'Hoodie',
      createMockupConfig("v1728392918", "hoodies")
    )
  };

  // Status configurations
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

  // Derived configurations
  const PRODUCT_TYPES = Object.keys(PRODUCT_CONFIG);
  const AVAILABLE_TYPES = Object.entries(PRODUCT_CONFIG).map(([value, config]) => ({
    name: config.label,
    value
  }));

  // Default product configuration
  const DEFAULT_PRODUCT_CONFIG = {
    label: 'Hoodie',
    basePrice: BASE.BASE_PRICE,
    productionCost: BASE.PRODUCTION_COST,
    designCost: BASE.DESIGN_COST,
    position: BASE.DEFAULT_POSITION,
    margins: {
      min: 0.15,
      recommended: 0.30
    },
    scale: BASE.DEFAULT_SCALE,
    mockupConfig: {
      availableColors: BASE.COLORS,
      views: BASE.VIEWS,
      boundaries: {
        front: { x: [35, 65], y: [40, 55] },
        back: { x: [30, 70], y: [20, 50] }
      }
    }
  };

  // Utility functions
  const getMockupUrl = (productType, color, view) => {
    try {
      const config = PRODUCT_CONFIG[productType]?.mockupConfig;
      if (!config) return null;
      return `${BASE.CLOUDINARY_URL}/${config.version}/${config.folder}/${config.getFilename(color, view)}.png`;
    } catch (error) {
      console.error('Error generating mockup URL:', error);
      return null;
    }
  };

  const isMockupAvailable = (productType, color, view) => {
    const config = PRODUCT_CONFIG[productType]?.mockupConfig;
    if (!config) return false;
    return config.availableColors.includes(color) && config.views.includes(view);
  };

  const getAvailableColorsForProduct = (productType) => {
    const colors = PRODUCT_CONFIG[productType]?.mockupConfig?.availableColors || BASE.COLORS;
    return AVAILABLE_COLORS.filter(color => colors.includes(color.value));
  };

  const getAvailableViews = (productType) => {
    return PRODUCT_CONFIG[productType]?.mockupConfig?.views || BASE.VIEWS;
  };

  return {
    CLOUDINARY_BASE: BASE.CLOUDINARY_URL,
    VIEWS: BASE.VIEWS,
    COLORS: BASE.COLORS,
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
};

// Initialize all configurations and utilities
const {
  CLOUDINARY_BASE,
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
} = ProductConfig();

// Export everything
export {
  CLOUDINARY_BASE,
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