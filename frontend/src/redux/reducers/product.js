import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: false,
  product: null,
  products: [],
  pendingProducts: [],
  allProducts: [],
  error: null,
  success: false,
  message: null,
  lastUpdated: null,  // New field to track last update
  selectedProduct: null, // New field to track selected product
  filters: {  // New field for filtering products
    status: null,
    priceRange: null,
    colors: [],
    productType: null
  },
  pagination: {  // New field for pagination
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10
  },
  designDefaults: {
    scale: 1,
    position: { x: 50, y: 25 }
  }

};

export const productReducer = createReducer(initialState, (builder) => {
  builder.addCase("productCreateRequest", (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
    })
    .addCase("productCreateSuccess", (state, action) => {
      state.isLoading = false;
      state.product = action.payload;
      state.success = true;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase("productCreateFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
      state.product = null;
    })

    // Get Shop Products
    .addCase("getAllProductsShopRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAllProductsShopSuccess", (state, action) => {
      state.isLoading = false;
      state.products = action.payload;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase("getAllProductsShopFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.products = [];
    })

    // Delete Product
    .addCase("deleteProductRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("deleteProductSuccess", (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
      state.error = null;
      // Remove deleted product from lists
      if (state.selectedProduct) {
        state.products = state.products.filter(p => p._id !== state.selectedProduct._id);
        state.allProducts = state.allProducts.filter(p => p._id !== state.selectedProduct._id);
        state.selectedProduct = null;
      }
      state.lastUpdated = new Date().toISOString();
    })
    .addCase("deleteProductFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })

    // Get All Products
    .addCase("getAllProductsRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAllProductsSuccess", (state, action) => {
      state.isLoading = false;
      state.allProducts = action.payload;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
      console.log('Products in store:', action.payload.length); // Debug log
      // Update pagination
      state.pagination.totalPages = Math.ceil(action.payload.length / state.pagination.itemsPerPage);
    })
    .addCase("getAllProductsFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.allProducts = [];
    })


.addCase("updateDesignPositionRequest", (state) => {
  state.isLoading = true;
  state.error = null;
})
.addCase("updateDesignPositionSuccess", (state, action) => {
  state.isLoading = false;
  state.error = null;
  // Update position in pending products
  const product = state.pendingProducts.find(p => p._id === action.payload.productId);
  if (product) {
    product.DesignPosition = action.payload.position;
  }
  // Update position in selected product if it exists
  if (state.selectedProduct?._id === action.payload.productId) {
    state.selectedProduct.DesignPosition = action.payload.position;
  }
})
.addCase("updateDesignPositionFail", (state, action) => {
  state.isLoading = false;
  state.error = action.payload;
})
.addCase("centerDesignRequest", (state) => {
  state.isLoading = true;
  state.error = null;
})
.addCase("centerDesignSuccess", (state, action) => {
  state.isLoading = false;
  state.error = null;
  // Update position in pending products
  const product = state.pendingProducts.find(p => p._id === action.payload.productId);
  if (product) {
    product.DesignPosition = action.payload.position;
  }
  // Update position in selected product if it exists
  if (state.selectedProduct?._id === action.payload.productId) {
    state.selectedProduct.DesignPosition = action.payload.position;
  }
})
.addCase("centerDesignFail", (state, action) => {
  state.isLoading = false;
  state.error = action.payload;
})    .addCase("updateProductDesignRequest", (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
    })
    .addCase("updateProductDesignSuccess", (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
      state.success = true;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase("updateProductDesignFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })

    // Fetch Pending Products
    .addCase("fetchPendingProductsRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("fetchPendingProductsSuccess", (state, action) => {
      state.isLoading = false;
      state.pendingProducts = action.payload.map(product => ({
        ...product,
        availableColors: product.availableColors || ['white'] // Ensure availableColors exists
      }));
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase("fetchPendingProductsFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.pendingProducts = [];
    })

    // Approve/Reject Product
    .addCase("approveRejectProductRequest", (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
    })
    .addCase("approveRejectProductSuccess", (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
      state.success = true;
      state.error = null;
    
      // Remove the product from pending list
      if (state.selectedProduct) {
        state.pendingProducts = state.pendingProducts.filter(
          p => p._id !== state.selectedProduct._id
        );
    
        // If product was approved, add it to allProducts with public status
        if (state.selectedProduct.status === 'public') {
          state.allProducts = state.allProducts.filter(p => p._id !== state.selectedProduct._id);
          state.allProducts.push({
            ...state.selectedProduct,
            status: 'public',
            visibility: 'public'
          });
        }
    
        state.selectedProduct = null;
      }
    
      state.lastUpdated = new Date().toISOString();
    })
    .addCase("approveRejectProductFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })

    // Select Product
    .addCase("selectProduct", (state, action) => {
      state.selectedProduct = action.payload;
    })

    // Update Filters
    .addCase("updateFilters", (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    })

    // Update Pagination
    .addCase("updatePagination", (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload
      };
    })

    // Reset States
    .addCase("resetProductSuccess", (state) => {
      state.success = false;
    })
    .addCase("clearErrors", (state) => {
      state.error = null;
    })
    .addCase("resetProductState", (state) => {
      return {
        ...initialState,
        lastUpdated: state.lastUpdated
      };
    });
});