// File: frontend/src/redux/actions/cart.js
import { toast } from "react-toastify";

export const CART_ACTION_TYPES = {
  ADD_TO_CART: "cart/addToCart",
  REMOVE_FROM_CART: "cart/removeFromCart",
  UPDATE_CART: "cart/updateCart",
};

export const addTocart = (data) => async (dispatch, getState) => {
  try {
    if (!data || !data._id || !data.shopId) {
      throw new Error("Essential item data (ID, ShopID) is missing.");
    }
    if (!data.designImage?.url) {
      throw new Error("Design image URL is missing.");
    }

    const { cart } = getState().cart;

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
      quantity: parseInt(data.quantity, 10) || 1,
      qty: parseInt(data.quantity, 10) || 1,
      stock: parseInt(data.stock, 10) || 100,
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

    if (cartItem.quantity > cartItem.stock) {
      throw new Error(
        `Not enough stock available for "${cartItem.DesignTitle}". Available: ${cartItem.stock}, Requested: ${cartItem.quantity}.`
      );
    }

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
        throw new Error(
          `Adding ${cartItem.quantity} more would exceed stock for "${cartItem.DesignTitle}". Available: ${existingItem.stock}, Current in cart: ${existingItem.quantity}.`
        );
      }

      updatedCart[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        qty: newQuantity,
      };
      toast.success(
        `Updated quantity for ${cartItem.DesignTitle} (${cartItem.size}, ${cartItem.ProductColor})`
      );
    } else {
      updatedCart = [...cart, cartItem];
      toast.success(
        `Added ${cartItem.DesignTitle} (${cartItem.size}, ${cartItem.ProductColor}) to cart`
      );
    }

    dispatch({
      type: CART_ACTION_TYPES.UPDATE_CART,
      payload: updatedCart,
    });

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
    if (!itemToRemove || !itemToRemove._id) {
      throw new Error("Item data is required to remove from cart.");
    }

    console.log("Removing item:", itemToRemove);

    const { cart } = getState().cart;

    const updatedCart = cart.filter(
      (i) =>
        !(
          i._id === itemToRemove._id &&
          i.size === itemToRemove.size &&
          i.ProductColor === itemToRemove.ProductColor
        )
    );

    if (updatedCart.length === cart.length) {
      console.warn("Item to remove not found in cart:", itemToRemove);
    } else {
      toast.info(
        `Removed ${itemToRemove.DesignTitle} (${itemToRemove.size}, ${itemToRemove.ProductColor}) from cart`
      );
    }

    dispatch({
      type: CART_ACTION_TYPES.UPDATE_CART,
      payload: updatedCart,
    });

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error("Remove from cart error:", error);
    toast.error(error.message || "Failed to remove item from cart.");
    return { success: false, message: error.message };
  }
};
