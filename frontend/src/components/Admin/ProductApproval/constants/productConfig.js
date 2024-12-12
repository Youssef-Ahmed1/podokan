
import { HiClock, HiCheck, HiX, HiExclamation } from 'react-icons/hi';

export const PRODUCT_TYPES = {
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
      getFilename: (color, view) => `t-shirt-${color}-${view}`
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
      getFilename: (color, view) => `long-sleeve-${color}-${view}`
    }
  },
  'hoodie': {
    label: 'Hoodie',
    basePrice: 490,
    productionCost: 400,
    designCost: 90,
    margins: {
      min: 0.15,
      recommended: 0.30
    },
    mockupConfig: {
      version: "v1728392918",
      folder: "hoodies",
      getFilename: (color, view) => `hoodie-${color}-${view}`
    }
  }
};

export const AVAILABLE_COLORS = [
  { name: 'White', value: 'white' },
  { name: 'Black', value: 'black' },
  { name: 'Navy', value: 'navy' },
  { name: 'Gray', value: 'gray' }
];

export const AVAILABLE_TYPES = [
  { name: 'T-Shirt', value: 't-shirt' },
  { name: 'Hoodie', value: 'hoodie' },
  { name: 'Long Sleeves', value: 'long-sleeves' }
];
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