export const addTocart = (data) => async (dispatch, getState) => {
  try {
    if (!data || !data._id || !data.shopId)
      throw new Error("Essential item data missing.");
    if (!data.designImage?.url)
      throw new Error("Cannot add item: Design image URL missing.");

    const quantityToAdd = parseInt(data.quantity, 10) || 1;
    if (quantityToAdd <= 0) throw new Error("Quantity must be positive.");

    const cartItem = {
      _id: data._id,
      DesignTitle: data.DesignTitle || "Untitled Design",
      designImage: {
        public_id: data.designImage?.public_id || null,
        url: data.designImage.url,
      },
      ProductType: data.ProductType || "Unknown Type",
      ProductColor: data.selectedColor || data.ProductColor || "White",
      size: data.selectedSize || data.size || "One Size",
      quantity: quantityToAdd,
      qty: quantityToAdd,
      stock: parseInt(data.stock, 10) >= 0 ? parseInt(data.stock, 10) : 100,
      shopId: data.shopId,
      shop: data.shop || { name: "Unknown Shop" },
      price: parseFloat(data.discountPrice || data.originalPrice || 0),
      discountPrice: parseFloat(data.discountPrice || 0),
      originalPrice: parseFloat(data.originalPrice || 0),
      designSpecs: {
        positionX: data.designSpecs?.positionX ?? data.DesignPosition?.x ?? 50,
        positionY: data.designSpecs?.positionY ?? data.DesignPosition?.y ?? 50,
        scale: data.designSpecs?.scale ?? data.DesignScale ?? 1,
        rotation: data.designSpecs?.rotation ?? data.DesignRotation ?? 0,
      },
    };

    const { cart } = getState().cart;
    const existingItemIndex = cart.findIndex(
      (item) =>
        item._id === cartItem._id &&
        item.size === cartItem.size &&
        item.ProductColor === cartItem.ProductColor
    );
    let updatedCart;

    if (existingItemIndex !== -1) {
      updatedCart = [...cart];
      const existingItem = updatedCart[existingItemIndex];
      const newQuantity = existingItem.quantity + cartItem.quantity;
      if (newQuantity > existingItem.stock) {
        toast.error(
          `Max available stock for "${cartItem.DesignTitle}" is ${existingItem.stock}.`
        );
        return { success: false, message: "Quantity exceeds available stock." };
      }
      updatedCart[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        qty: newQuantity,
      };
      toast.success(`Updated quantity for ${cartItem.DesignTitle}`);
    } else {
      if (cartItem.quantity > cartItem.stock) {
        toast.error(
          `Not enough stock for "${cartItem.DesignTitle}". Max: ${cartItem.stock}.`
        );
        return { success: false, message: "Quantity exceeds available stock." };
      }
      updatedCart = [...cart, cartItem];
      toast.success(`Added ${cartItem.DesignTitle} to cart`);
    }

    dispatch({ type: CART_ACTION_TYPES.UPDATE_CART, payload: updatedCart });
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error("Add to cart action error:", error);
    toast.error(error.message || "Failed to add item to cart.");
    return { success: false, message: error.message };
  }
};

export const removeFromCart = (itemToRemove) => async (dispatch, getState) => {
  try {
    if (
      !itemToRemove ||
      !itemToRemove._id ||
      !itemToRemove.size ||
      !itemToRemove.ProductColor
    ) {
      throw new Error("Item data (ID, Size, Color) required for removal.");
    }
    const { cart } = getState().cart;
    const updatedCart = cart.filter(
      (i) =>
        !(
          i._id === itemToRemove._id &&
          i.size === itemToRemove.size &&
          i.ProductColor === itemToRemove.ProductColor
        )
    );

    if (updatedCart.length === cart.length)
      console.warn("Item to remove not found:", itemToRemove);
    else toast.info(`Removed ${itemToRemove.DesignTitle}`);

    dispatch({ type: CART_ACTION_TYPES.UPDATE_CART, payload: updatedCart });
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error("Remove from cart action error:", error);
    toast.error(error.message || "Failed to remove item from cart.");
    return { success: false, message: error.message };
  }
};
