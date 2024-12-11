export const STATUS_CONFIG = {
    pending: {
      value: 'pending',
      label: 'Pending Review',
      color: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      description: 'Awaiting admin review'
    },
    public: {
      value: 'public',
      label: 'Approved',
      color: 'bg-green-100',
      textColor: 'text-green-800',
      description: 'Visible to all users'
    },
    rejected: {
      value: 'rejected',
      label: 'Rejected',
      color: 'bg-red-100',
      textColor: 'text-red-800',
      description: 'Not approved for sale'
    }
  };
  
  export const PRODUCT_TYPES = {
    't-shirt': {
      label: 'T-Shirt',
      basePrice: 290,
      productionCost: 150,
      margins: {
        min: 0.3,
        recommended: 0.5,
      }
    },
    'hoodie': {
      label: 'Hoodie',
      basePrice: 450,
      productionCost: 250,
      margins: {
        min: 0.35,
        recommended: 0.55,
      }
    },
    'long-sleeves': {
      label: 'Long Sleeves',
      basePrice: 370,
      productionCost: 200,
      margins: {
        min: 0.35,
        recommended: 0.55,
      }
    }
  };