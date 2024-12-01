import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  adminOrders: [], // Add this
  adminOrderLoading: false, // Add this
};
export const orderReducer = createReducer(initialState, (builder) => {
  builder.addCase("getAllOrdersUserRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("getAllOrdersUserSuccess", (state, action) => {
      state.isLoading = false;
      state.orders = action.payload;
    })
    .addCase("getAllOrdersUserFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addCase("getAllOrdersShopRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("getAllOrdersShopSuccess", (state, action) => {
      state.isLoading = false;
      state.orders = action.payload;
    })
    .addCase("getAllOrdersShopFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addCase("getAllOrdersOfAdminRequest", (state) => {
      state.adminOrderLoading = true;
    })
    .addCase("getAllOrdersOfAdminSuccess", (state, action) => {
      state.adminOrderLoading = false;
      state.adminOrders = action.payload.orders || [];
    })
    .addCase("getAllOrdersOfAdminFailed", (state, action) => {
      state.adminOrderLoading = false;
      state.error = action.payload;
      state.adminOrders = [];
    });
});