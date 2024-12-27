// add to cart
export const addTocart = (data) => async (dispatch, getState) => {
  try {
    dispatch({
      type: "addToCart",
      payload: data
    });
    return { success: true };
  } catch (error) {
    console.error("Add to cart error:", error);
    return { success: false, message: error.message };
  }
};
// remove from cart
export const removeFromCart = (data) => async (dispatch, getState) => {
  dispatch({
    type: "removeFromCart",
    payload: data._id,
  });
  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cart));
  return data;
};
