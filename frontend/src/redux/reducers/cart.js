import { createReducer } from "@reduxjs/toolkit";

const cartInitialState = {
  cart: localStorage.getItem("cartItems")
    ? JSON.parse(localStorage.getItem("cartItems"))
    : [],
};


export const cartReducer = createReducer(cartInitialState, (builder) => {
  builder
    .addCase("addToCart", (state, action) => {
      const item = action.payload;
      const existingItem = state.cart.find(
        i => 
          i._id === item._id && 
          i.selectedSize === item.selectedSize && 
          i.selectedColor === item.selectedColor
      );

      if (existingItem) {
        state.cart = state.cart.map((i) => 
          i._id === existingItem._id && 
          i.selectedSize === item.selectedSize && 
          i.selectedColor === item.selectedColor
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        state.cart.push(item);
      }
      localStorage.setItem("cartItems", JSON.stringify(state.cart));
    })
    .addCase("removeFromCart", (state, action) => {
      state.cart = state.cart.filter((i) => i._id !== action.payload);
      localStorage.setItem("cartItems", JSON.stringify(state.cart));
    });
});