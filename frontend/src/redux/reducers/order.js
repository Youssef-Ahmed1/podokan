import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  orders: [], // Add this
  adminOrders: [],
  adminOrderLoading: false,
  totalAmount: 0,
  ordersCount: 0,
  error: null
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
    
    .addCase("clearErrors", (state) => {
      state.error = null;
    });
});