// add to cart
export const addTocart = (data) => async (dispatch, getState) => {
  try {
    const { cart } = getState().cart;

    // Create standardized cart item with all necessary fields
    const cartItem = {
      _id: data._id,
      DesignTitle: data.DesignTitle,
      designImage: data.designImage?.url || data.designImage,
      ProductType: data.ProductType,
      selectedColor: data.selectedColor,
      selectedSize: data.selectedSize,
      quantity: data.quantity || 1,
      qty: data.quantity || 1, // Add this for compatibility
      stock: data.stock || 100,
      shopId: data.shopId,
      shop: data.shop,
      price: data.discountPrice || data.originalPrice,
      discountPrice: data.discountPrice,
      originalPrice: data.originalPrice,
      DesignScale: data.DesignScale || 0.8,
      DesignPosition: data.DesignPosition || { x: 50, y: 40 },
    };

    // Check for existing item with same ID, size, and color
    const existingItemIndex = cart.findIndex(
      (item) =>
        item._id === cartItem._id &&
        item.selectedSize === cartItem.selectedSize &&
        item.selectedColor === cartItem.selectedColor
    );

    let updatedCart;

    if (existingItemIndex !== -1) {
      // Update existing item
      updatedCart = [...cart];
      const newQuantity =
        updatedCart[existingItemIndex].quantity + cartItem.quantity;

      if (newQuantity > cartItem.stock) {
        throw new Error("Not enough stock available");
      }

      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: newQuantity,
        qty: newQuantity,
      };
    } else {
      // Add new item
      updatedCart = [...cart, cartItem];
    }

    dispatch({
      type: "addToCart",
      payload: cartItem,
    });

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
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
