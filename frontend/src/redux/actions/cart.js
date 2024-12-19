// redux/actions/cart.js
export const addTocart = (data) => async (dispatch, getState) => {
  try {
    const { cart } = getState().cart;
    
    const cartItem = {
      _id: data._id,
      name: data.name,
      price: data.discountPrice || data.originalPrice,
      quantity: data.quantity || 1,
      selectedSize: data.selectedSize,
      selectedColor: data.selectedColor,
      stock: data.stock,
      shopId: data.shopId,
      shop: data.shop,
      designImage: data.designImage,
      mockupUrl: data.mockupUrl // Add the mockup URL
    };

    // Check if item already exists
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
        throw new Error("Not enough stock available");
      }
      
      updatedCart[existingItemIndex].quantity = newQuantity;
      
      dispatch({
        type: 'UPDATE_CART',
        payload: updatedCart,
      });
    } else {
      // Add new item
      dispatch({
        type: 'ADD_TO_CART',
        payload: [...cart, cartItem],
      });
    }

    localStorage.setItem('cartItems', JSON.stringify(getState().cart.cart));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};