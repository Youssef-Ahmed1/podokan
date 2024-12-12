// ./constants/productConfig.js

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