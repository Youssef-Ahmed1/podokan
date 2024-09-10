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
};

export const productReducer = createReducer(initialState, (builder) => {
  builder
    .addCase("productCreateRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("productCreateSuccess", (state, action) => {
      state.isLoading = false;
      state.product = action.payload;
      state.success = true;
    })
    .addCase("productCreateFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })
    .addCase("getAllProductsShopRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("getAllProductsShopSuccess", (state, action) => {
      state.isLoading = false;
      state.products = action.payload;
    })
    .addCase("getAllProductsShopFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addCase("deleteProductRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("deleteProductSuccess", (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
    })
    .addCase("deleteProductFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addCase("getAllProductsRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("getAllProductsSuccess", (state, action) => {
      state.isLoading = false;
      state.allProducts = action.payload;
    })
    .addCase("getAllProductsFailed", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addCase("updateProductDesignRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("updateProductDesignSuccess", (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
      state.success = true;
    })
    .addCase("updateProductDesignFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })
    .addCase("fetchPendingProductsRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("fetchPendingProductsSuccess", (state, action) => {
      state.isLoading = false;
      state.pendingProducts = action.payload;
    })
    .addCase("fetchPendingProductsFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addCase("approveRejectProductRequest", (state) => {
      state.isLoading = true;
    })
    .addCase("approveRejectProductSuccess", (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
      state.success = true;
    })
    .addCase("approveRejectProductFail", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })
    .addCase("resetProductSuccess", (state) => {
      state.success = false;
    })
    .addCase("clearErrors", (state) => {
      state.error = null;
    });
});
