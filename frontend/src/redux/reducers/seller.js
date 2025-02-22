// redux/reducers/seller.js
import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: true,
  isSeller: false,
  seller: null,
  sellers: [],
  sellersCount: 0,
  error: null,
};

export const sellerReducer = createReducer(initialState, (builder) => {
  builder
    // Load seller cases
    .addCase("LoadSellerRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("LoadSellerSuccess", (state, action) => {
      state.isLoading = false;
      state.isSeller = true;
      state.seller = action.payload;
      state.error = null;
    })
    .addCase("LoadSellerFail", (state, action) => {
      state.isLoading = false;
      state.isSeller = false;
      state.seller = null;
      state.error = action.payload;
    })

    // Login cases
    .addCase("SellerLoginRequest", (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase("SellerLoginSuccess", (state, action) => {
      state.isLoading = false;
      state.isSeller = true;
      state.seller = action.payload;
      state.error = null;
    })
    .addCase("SellerLoginFail", (state, action) => {
      state.isLoading = false;
      state.isSeller = false;
      state.seller = null;
      state.error = action.payload;
    })

    // Logout cases
    .addCase("SellerLogoutRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("SellerLogoutSuccess", (state) => {
      state.isLoading = false;
      state.isSeller = false;
      state.seller = null;
      state.error = null;
    })
    .addCase("SellerLogoutFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })

    // Get all sellers cases (admin)
    .addCase("getAllSellersRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("getAllSellersSuccess", (state, action) => {
      state.isLoading = false;
      state.sellers = action.payload.sellers;
      state.sellersCount = action.payload.sellersCount;
      state.error = null;
    })
    .addCase("getAllSellersFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.sellers = [];
      state.sellersCount = 0;
    })

    // Clear errors
    .addCase("clearErrors", (state) => {
      state.error = null;
    });
});