import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dkot9tyjm/image/upload';

const VIEWS = ['front', 'back'];

export const PRODUCT_TYPES = {
  'hoodie': {
    label: 'Hoodie',
    basePrice: 850, // Price in EGP
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
      views: VIEWS,
      boundaries: {
        front: { x: [30, 70], y: [20, 50] }, // Front boundaries
        back: { x: [20, 80], y: [15, 70] }   // Back boundaries, larger area including hood
      }
    }
  }
  // Commented out products for future use
  /*
  't-shirt': {
    label: 'T-Shirt',
    basePrice: 295,
    productionCost: 205,
    designCost: 90,
    margins: {
      min: 0.15,
      recommended: 0.30
    },
    mockupConfig: {
      version: "v1728393898",
      folder: "t-shirts",
      getFilename: (color, view) => `t-shirt-${color}-${view}`,
      availableColors: ['white', 'black', 'red', 'blue', 'gray', 'green'],
      views: VIEWS
    }
  },
  'long-sleeve': {
    label: 'Long Sleeve',
    basePrice: 390,
    productionCost: 300,
    designCost: 90,
    margins: {
      min: 0.15,
      recommended: 0.30
    },
    mockupConfig: {
      version: "v1728394665",
      folder: "long-sleeves",
      getFilename: (color, view) => `longsleeves-${color}-${view}`,
      availableColors: ['white', 'black', 'red', 'blue', 'gray'],
      views: VIEWS
    }
  }
  */
};

export const AVAILABLE_COLORS = [
  { name: 'White', value: 'white' },
  { name: 'Black', value: 'black' }
];

export const AVAILABLE_TYPES = Object.entries(PRODUCT_TYPES).map(([value, config]) => ({
  name: config.label,
  value
}));


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

const getMockupUrl = (productType, color, view) => {
  try {
    const config = PRODUCT_TYPES[productType]?.mockupConfig;
    if (!config) return null;

    return `${CLOUDINARY_BASE}/${config.version}/${config.folder}/${config.getFilename(color, view)}.png`;
  } catch (error) {
    console.error('Error generating mockup URL:', error);
    return null;
  }
};

export const isMockupAvailable = (productType, color, view) => {
  const config = PRODUCT_TYPES[productType]?.mockupConfig;
  if (!config) return false;
  return config.availableColors.includes(color) && config.views.includes(view);
};

export const getAvailableColorsForProduct = (productType) => {
  const colors = PRODUCT_TYPES[productType]?.mockupConfig?.availableColors || [];
  return AVAILABLE_COLORS.filter(color => colors.includes(color.value));
};

export const getAvailableViews = (productType) => {
  return PRODUCT_TYPES[productType]?.mockupConfig?.views || VIEWS;
};

export {
  CLOUDINARY_BASE,
  getMockupUrl,
  VIEWS
};