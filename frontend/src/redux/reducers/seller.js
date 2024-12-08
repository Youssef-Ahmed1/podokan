import { createReducer } from "@reduxjs/toolkit";

const sellerInitialState = {
  isLoading: true,
  isSeller: false,
  seller: null,
  sellers: [],
  sellersCount: 0,
  error: null
};

export const sellerReducer = createReducer(sellerInitialState, (builder) => {
  builder
    .addCase("LoadSellerRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("LoadSellerSuccess", (state, action) => {
      state.isSeller = true;
      state.isLoading = false;
      state.seller = action.payload;
    })
    .addCase("LoadSellerFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isSeller = false;
      state.seller = null;
    })
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
      state.error = action.payload;
      state.isSeller = false;
      state.seller = null;
    })
    .addCase("SellerLogoutSuccess", (state) => {
      state.isSeller = false;
      state.seller = null;
      state.isLoading = false;
    })
    .addCase("SellerLogoutFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addCase("getAllSellersRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("getAllSellersSuccess", (state, action) => {
      state.isLoading = false;
      state.sellers = action.payload.sellers || [];
      state.sellersCount = action.payload.sellersCount || 0;
    })
    .addCase("getAllSellerFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.sellers = [];
      state.sellersCount = 0;
    })
    .addCase("clearErrors", (state) => {
      state.error = null;
    });
});