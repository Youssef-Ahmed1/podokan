import { createReducer } from "@reduxjs/toolkit";
import { CART_ACTION_TYPES } from "../actions/cart";

const loadInitialCart = () => {
  try {
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      if (Array.isArray(parsedCart)) {
        return parsedCart;
      }
    }
  } catch (error) {
    console.error("Error parsing cart items from localStorage:", error);
    localStorage.removeItem("cartItems"); // Clear corrupted data
  }
  return []; 
};

const cartInitialState = {
  cart: loadInitialCart(),
};

export const cartReducer = createReducer(cartInitialState, (builder) => {
  builder.addCase(CART_ACTION_TYPES.UPDATE_CART, (state, action) => {
    if (Array.isArray(action.payload)) {
      state.cart = action.payload;
    } else {
      console.error("UPDATE_CART received non-array payload:", action.payload);
    }
  });
});

export default cartReducer;