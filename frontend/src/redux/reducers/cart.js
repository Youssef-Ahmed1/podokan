import { createReducer } from "@reduxjs/toolkit";
import { CART_ACTION_TYPES } from "../actions/cart";

const cartInitialState = {
  cart: localStorage.getItem("cartItems")
    ? JSON.parse(localStorage.getItem("cartItems"))
    : [],
};

export const cartReducer = createReducer(cartInitialState, (builder) => {
  builder.addCase(CART_ACTION_TYPES.UPDATE_CART, (state, action) => {
    if (Array.isArray(action.payload)) {
      state.cart = action.payload;
    } else {
      console.error("UPDATE_CART received invalid payload:", action.payload);
    }
  });
});

export default cartReducer;