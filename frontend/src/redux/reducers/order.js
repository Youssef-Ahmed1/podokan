// orderReducer.js
import { createReducer } from "@reduxjs/toolkit";

const initialState = {
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
};

export const orderReducer = createReducer(initialState, (builder) => {
  builder
    // User Orders
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

    // Shop Orders
    .addCase("getAllOrdersShopRequest", (state) => {
      state.shop.isLoading = true;
      state.shop.error = null;
    })
    .addCase("getAllOrdersShopSuccess", (state, action) => {
      state.shop.isLoading = false;
      state.shop.orders = action.payload;
      state.shop.error = null;
    })
    .addCase("getAllOrdersShopFailed", (state, action) => {
      state.shop.isLoading = false;
      state.shop.error = action.payload;
      state.shop.orders = [];
    })

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
    .addCase("updateOrderStatusRequest", (state) => {
      state.statusUpdate.loading = true;
      state.statusUpdate.error = null;
    })
    .addCase("updateOrderStatusSuccess", (state, action) => {
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
        order._id === action.payload._id ? action.payload : order
      );
    })
    .addCase("updateOrderStatusFailed", (state, action) => {
      state.statusUpdate.loading = false;
      state.statusUpdate.error = action.payload;
      state.statusUpdate.success = false;
    })

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
    });
});