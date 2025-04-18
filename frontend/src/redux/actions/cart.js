// File: frontend/src/redux/actions/cart.js
import { toast } from "react-toastify";

export const CART_ACTION_TYPES = {
  UPDATE_CART: "cart/updateCart",
};

export const addTocart = (data) => async (dispatch, getState) => {
  try {
    if (
      !data?._id ||
      !data?.shopId ||
      !data?.designImage?.url ||
      !data?.DesignTitle ||
      !data?.ProductType ||
      (!data?.ProductColor && !data?.selectedColor) ||
      (!data?.size && !data?.selectedSize) ||
      data.price == null ||
      data.quantity == null
    ) {
      throw new Error("Missing essential item data for cart.");
    }

    const cartItem = {
      _id: data._id,
      DesignTitle: data.DesignTitle,
      designImage: {
        public_id: data.designImage?.public_id || null,
        url: data.designImage.url,
      },
      ProductType: data.ProductType,
      ProductColor: data.selectedColor || data.ProductColor,
      size: data.selectedSize || data.size,
      quantity: parseInt(data.quantity, 10) || 1,
      qty: parseInt(data.quantity, 10) || 1,
      stock: parseInt(data.stock, 10) || 100,
      shopId: data.shopId,
      shop: data.shop || { name: "Unknown Shop" },
      price: parseFloat(
        data.discountPrice || data.originalPrice || data.price || 0
      ),
      originalPrice: parseFloat(data.originalPrice || data.price || 0),
      discountPrice: parseFloat(data.discountPrice || data.price || 0),
      designSpecs: {
        positionX: data.designSpecs?.positionX ?? data.DesignPosition?.x ?? 50,
        positionY: data.designSpecs?.positionY ?? data.DesignPosition?.y ?? 50,
        scale: data.designSpecs?.scale ?? data.DesignScale ?? 1,
        rotation: data.designSpecs?.rotation ?? data.DesignRotation ?? 0,
      },
    };

    if (cartItem.quantity < 1) throw new Error("Quantity must be at least 1.");
    if (cartItem.quantity > cartItem.stock)
      throw new Error(
        `Not enough stock for "${cartItem.DesignTitle}". Available: ${cartItem.stock}.`
      );

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
      if (newQuantity > existingItem.stock)
        throw new Error(
          `Adding ${cartItem.quantity} more would exceed stock for "${cartItem.DesignTitle}". Available: ${existingItem.stock}.`
        );
      updatedCart[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        qty: newQuantity,
      };
      toast.success(`Updated quantity for ${cartItem.DesignTitle}`);
    } else {
      updatedCart = [...cart, cartItem];
      toast.success(`Added ${cartItem.DesignTitle} to cart`);
    }

    dispatch({ type: CART_ACTION_TYPES.UPDATE_CART, payload: updatedCart });
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error("Add to cart error:", error);
    toast.error(error.message || "Failed to add item to cart.");
    return { success: false, message: error.message };
  }
};

export const removeFromCart = (itemToRemove) => async (dispatch, getState) => {
  try {
    if (
      !itemToRemove?._id ||
      !itemToRemove.size ||
      !itemToRemove.ProductColor
    ) {
      throw new Error("Item ID, Size, and Color required to remove.");
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

    if (updatedCart.length < cart.length)
      toast.info(`Removed ${itemToRemove.DesignTitle}`);
    else console.warn("Item to remove not found in cart:", itemToRemove);

    dispatch({ type: CART_ACTION_TYPES.UPDATE_CART, payload: updatedCart });
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error("Remove from cart error:", error);
    toast.error(error.message || "Failed to remove item.");
    return { success: false, message: error.message };
  }
};