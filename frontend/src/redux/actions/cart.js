// add to cart
export const addTocart = (data) => async (dispatch, getState) => {
  try {
    const { cart } = getState().cart;

    // Create standardized cart item with all necessary fields
    const cartItem = {
      _id: data._id,
      DesignTitle: data.DesignTitle || "Untitled Design",
      designImage: {
        public_id: data.designImage?.public_id || null,
        url: data.designImage?.url || data.designImage || "",
      },
      ProductType: data.ProductType || "Unknown Type",
      ProductColor: data.selectedColor || "White",
      size: data.selectedSize || "One Size",
      quantity: data.quantity || 1,
      qty: data.quantity || 1, // Add this for compatibility
      stock: data.stock || 100,
      shopId: data.shopId,
      shop: data.shop,
      price: data.discountPrice || data.originalPrice || 0,
      discountPrice: data.discountPrice || 0,
      originalPrice: data.originalPrice || 0,
      designSpecs: {
        positionX: data.DesignPosition?.x || 50,
        positionY: data.DesignPosition?.y || 50,
        scale: data.DesignScale || 1,
        rotation: data.DesignRotation || 0,
      },
    };

    // Check for existing item with same ID, size, and color
    const existingItemIndex = cart.findIndex(
      (item) =>
        item._id === cartItem._id &&
        item.size === cartItem.size &&
        item.ProductColor === cartItem.ProductColor
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

export const removeFromCart = (data) => async (dispatch, getState) => {
  dispatch({
    type: "removeFromCart",
    payload: data._id,
  });
  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cart));
  return data;
};
