import { createReducer } from "@reduxjs/toolkit";

const initialState = {
<<<<<<< HEAD
  isLoading: false,
  error: null,
  orders: [],
  user: {
    orders: [],
    isLoading: false,
    error: null
  },
  shop: {
    orders: [],
    isLoading: false,
    error: null
  },
  admin: {
    orders: [],
    totalAmount: 0,
    ordersCount: 0,
    totalPages: 1,
    currentPage: 1,
    isLoading: false,
    error: null
  },
  statusUpdate: {
    loading: false,
    success: false,
    error: null
  },
  designDownload: {
    loading: false,
    success: false,
    error: null
  },
  filters: {
    status: '',
    startDate: '',
    endDate: '',
    sort: '-createdAt'
  }
=======
  isLoading: true,
  orders: [], // Add this
  adminOrders: [],
  adminOrderLoading: false,
  totalAmount: 0,
  ordersCount: 0,
  error: null
>>>>>>> parent of bb3e5595 (save)
};

export const orderReducer = createReducer(initialState, (builder) => {
  builder
    // Seller orders
    .addCase("getAllOrdersShopRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAllOrdersShopSuccess", (state, action) => {
      state.isLoading = false;
      state.orders = action.payload;
      state.error = null;
    })
    .addCase("getAllOrdersShopFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.orders = [];
    })
    
    // User orders
    .addCase("getAllOrdersUserRequest", (state) => {
      state.user.isLoading = true;
      state.user.error = null;
    })
    .addCase("getAllOrdersUserSuccess", (state, action) => {
      state.user.isLoading = false;
      state.user.orders = action.payload;
      state.user.error = null;
    })
    .addCase("getAllOrdersUserFailed", (state, action) => {
      state.user.isLoading = false;
      state.user.error = action.payload;
      state.user.orders = [];
    })

    // Admin orders
    .addCase("getAllOrdersOfAdminRequest", (state) => {
      state.adminOrderLoading = true;
      state.error = null;
    })
    .addCase("getAllOrdersOfAdminSuccess", (state, action) => {
      state.adminOrderLoading = false;
      state.adminOrders = action.payload.orders;
      state.totalAmount = action.payload.totalAmount;
      state.ordersCount = action.payload.ordersCount;
      state.error = null;
    })
    .addCase("getAllOrdersOfAdminFailed", (state, action) => {
      state.adminOrderLoading = false;
      state.error = action.payload;
      state.adminOrders = [];
      state.totalAmount = 0;
      state.ordersCount = 0;
    })

<<<<<<< HEAD
    // Admin Orders
    .addCase("getAllOrdersAdminRequest", (state) => {
      state.admin.isLoading = true;
      state.admin.error = null;
    })
    .addCase("getAllOrdersAdminSuccess", (state, action) => {
      state.admin.isLoading = false;
      state.admin.orders = action.payload.orders;
      state.admin.totalAmount = action.payload.totalAmount;
      state.admin.ordersCount = action.payload.ordersCount;
      state.admin.totalPages = action.payload.totalPages;
      state.admin.currentPage = action.payload.currentPage;
      state.admin.error = null;
    })
    .addCase("getAllOrdersAdminFailed", (state, action) => {
      state.admin.isLoading = false;
      state.admin.error = action.payload;
      state.admin.orders = [];
      state.admin.totalAmount = 0;
      state.admin.ordersCount = 0;
    })

    // Update Order Status
=======
>>>>>>> parent of bb3e5595 (save)
    .addCase("updateOrderStatusRequest", (state) => {
      state.statusUpdate.loading = true;
      state.statusUpdate.error = null;
    })
    .addCase("updateOrderStatusSuccess", (state, action) => {
<<<<<<< HEAD
      state.statusUpdate.loading = false;
      state.statusUpdate.success = true;
      // Update in user orders
      state.user.orders = state.user.orders.map(order => 
        order._id === action.payload._id ? action.payload : order
      );
      // Update in shop orders
      state.shop.orders = state.shop.orders.map(order => 
        order._id === action.payload._id ? action.payload : order
      );
      // Update in admin orders
      state.admin.orders = state.admin.orders.map(order => 
=======
      state.isLoading = false;
      state.adminOrders = state.adminOrders.map(order => 
>>>>>>> parent of bb3e5595 (save)
        order._id === action.payload._id ? action.payload : order
      );
    })
    .addCase("updateOrderStatusFailed", (state, action) => {
      state.statusUpdate.loading = false;
      state.statusUpdate.error = action.payload;
      state.statusUpdate.success = false;
    })

<<<<<<< HEAD
    // Design Download
    .addCase("downloadDesignRequest", (state) => {
      state.designDownload.loading = true;
      state.designDownload.error = null;
    })
    .addCase("downloadDesignSuccess", (state) => {
      state.designDownload.loading = false;
      state.designDownload.success = true;
      state.designDownload.error = null;
    })
    .addCase("downloadDesignFailed", (state, action) => {
      state.designDownload.loading = false;
      state.designDownload.success = false;
      state.designDownload.error = action.payload;
    })

    // Filter Updates
    .addCase("updateFilters", (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    })

    // Real-time Updates
    .addCase("realTimeOrderUpdate", (state, action) => {
      const { orderId, status, timestamp } = action.payload;
      // Update in all relevant order lists
      ['user', 'shop', 'admin'].forEach(section => {
        if (state[section].orders) {
          state[section].orders = state[section].orders.map(order =>
            order._id === orderId ? { ...order, status, updatedAt: timestamp } : order
          );
        }
      });
    })

    // Clear States
    .addCase("clearOrderErrors", (state) => {
      state.error = null;
      state.user.error = null;
      state.shop.error = null;
      state.admin.error = null;
      state.statusUpdate.error = null;
      state.designDownload.error = null;
    })
    .addCase("clearOrderSuccess", (state) => {
      state.statusUpdate.success = false;
      state.designDownload.success = false;
    })
    
    // Reset Filters
    .addCase("resetFilters", (state) => {
      state.filters = {
        status: '',
        startDate: '',
        endDate: '',
        sort: '-createdAt'
      };
=======
    .addCase("clearErrors", (state) => {
      state.error = null;
>>>>>>> parent of bb3e5595 (save)
    });
});