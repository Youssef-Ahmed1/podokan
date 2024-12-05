import { createReducer } from "@reduxjs/toolkit";

const sellerInitialState = {
  isLoading: true,
  sellers: [],
  sellersCount: 0,
};

export const sellerReducer = createReducer(sellerInitialState, (builder) => {
  builder.addCase("LoadSellerRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("LoadSellerSuccess", (state, action) => {
      state.isSeller = true;
      state.isLoading = false;
      state.sellers = action.payload;
    })
    .addCase("LoadSellerFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isSeller = false;
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
    });
});
