// add to cart
export const addTocart = (data) => async (dispatch, getState) => {
  try {
    const { cart } = getState().cart;
    
    // Create standardized cart item
    const cartItem = {
      _id: data._id,
      DesignTitle: data.DesignTitle,
      designImage: data.designImage?.url || data.designImage,
      ProductType: data.ProductType,
      selectedColor: selectedColor,
      selectedSize: selectedSize,
      quantity: count,
      stock: data.stock || 100,
      shopId: data.shopId,
      shop: data.shop,
      price: price, // Use the parsed price
      discountPrice: parseFloat(data.discountPrice) || price,
      originalPrice: parseFloat(data.originalPrice) || price,
      DesignScale: data.DesignScale || 0.5,
      DesignPosition: data.DesignPosition || { x: 50, y: 50 }
    };
  
  
    // Check for existing item
    const existingItemIndex = cart.findIndex(
      item => 
        item._id === cartItem._id && 
        item.selectedSize === cartItem.selectedSize && 
        item.selectedColor === cartItem.selectedColor
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      const updatedCart = [...cart];
      const newQuantity = updatedCart[existingItemIndex].quantity + cartItem.quantity;
      
      if (newQuantity > cartItem.stock) {
        return { success: false, message: "Not enough stock available" };
      }
      
      updatedCart[existingItemIndex].quantity = newQuantity;
      
      dispatch({
        type: 'UPDATE_CART',
        payload: updatedCart
      });
    } else {
      // Add new item
      dispatch({
        type: 'ADD_TO_CART',
        payload: [...cart, cartItem]
      });
    }

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
