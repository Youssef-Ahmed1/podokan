// add to cart
export const addTocart = (data) => async (dispatch, getState) => {
  try {
    const { cart } = getState().cart;
    
    // Check if item already exists in cart
    const existingItem = cart.find(
      item => item._id === data._id && 
      item.selectedSize === data.selectedSize && 
      item.selectedColor === data.selectedColor
    );

    if (existingItem) {
      // Update quantity if stock allows
      const newQuantity = existingItem.quantity + data.quantity;
      if (newQuantity > data.stock) {
        return { success: false, message: "Not enough stock available" };
      }
      
      const updatedCart = cart.map(item => 
        item._id === existingItem._id ? 
        { ...item, quantity: newQuantity } : 
        item
      );
      
      dispatch({
        type: 'UPDATE_CART',
        payload: updatedCart,
      });
    } else {
      dispatch({
        type: 'ADD_TO_CART',
        payload: [...cart, data],
      });
    }

    // Save to localStorage
    localStorage.setItem('cartItems', JSON.stringify(getState().cart.cart));
    return { success: true };
  } catch (error) {
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
