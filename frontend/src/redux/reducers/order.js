// orderReducer.js
import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  orders: [],
  admin: {
    isLoading: false,
    orders: [],
    totalAmount: 0,
    ordersCount: 0,
    error: null
  },
  shop: {
    isLoading: false,
    orders: [],
    error: null
  },
  error: null
};


export const orderReducer = createReducer(initialState, (builder) => {
  builder
    .addCase("getAllOrdersUserRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("getAllOrdersUserSuccess", (state, action) => {
      state.isLoading = false;
      state.orders = action.payload;
      state.error = null;
    })
    .addCase("getAllOrdersUserFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.orders = [];
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
      state.isLoading = true;
      state.error = null;
    })
    .addCase("updateOrderStatusSuccess", (state, action) => {
      state.isLoading = false;
      // Update in user orders
      state.orders = state.orders.map(order => 
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
      state.error = null;
    })
    .addCase("updateOrderStatusFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })

    // Clear Errors
    .addCase("clearOrderErrors", (state) => {
      state.error = null;
      state.shop.error = null;
      state.admin.error = null;
    });
});