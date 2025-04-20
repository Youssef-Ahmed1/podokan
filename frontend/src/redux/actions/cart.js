// File: frontend/src/redux/actions/cart.js
import { toast } from "react-toastify";

export const CART_ACTION_TYPES = {
  UPDATE_CART: "cart/updateCart",
};

export const addTocart = (data) => async (dispatch, getState) => {
  try {
    // --- Enhanced Initial Validation ---
    if (!data || !data._id) throw new Error("Essential item ID missing.");
    if (!data.designImage?.url)
      throw new Error("Cannot add item: Design image URL missing.");

    let shopIdValue = null;
    let shopInfoForCart = { name: "Unknown Shop", _id: null }; // Default shop info

    if (data.shopId && typeof data.shopId === "object" && data.shopId._id) {
      // Case 1: data.shopId is an object like { _id: '...', name: '...' }
      shopIdValue = data.shopId._id.toString();
      shopInfoForCart = {
        _id: shopIdValue,
        name: data.shopId.name || data.shop?.name || "Unknown Shop",
      };
    } else if (data.shopId && typeof data.shopId === "string") {
      shopIdValue = data.shopId;
      if (data.shop && typeof data.shop === "object") {
        shopInfoForCart = {
          _id: shopIdValue,
          name: data.shop.name || "Unknown Shop",
        };
      } else {
        shopInfoForCart._id = shopIdValue; // Still store the ID here
      }
    } else if (data.shop && typeof data.shop === "object" && data.shop._id) {
      // Case 3: data.shopId is missing/invalid, but data.shop object has _id
      shopIdValue = data.shop._id.toString();
      shopInfoForCart = {
        _id: shopIdValue,
        name: data.shop.name || "Unknown Shop",
      };
      console.warn(
        "Using shopId from data.shop as data.shopId was invalid/missing."
      );
    }

    // Final check - Throw error if we couldn't get a valid ID string
    if (!shopIdValue || typeof shopIdValue !== "string") {
      console.error(
        "CRITICAL: Could not determine a valid shopId string from data:",
        data
      );
      throw new Error("Cannot add item: Shop ID is missing or invalid.");
    }
    // --- End shopId Extraction ---

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
      stock: parseInt(data.stock, 10) >= 0 ? parseInt(data.stock, 10) : 100, // Default high if missing
      shopId: shopIdValue, // <-- Use the extracted STRING ID
      shop: shopInfoForCart, // <-- Store the object (with name/_id) for UI use
      price: parseFloat(
        data.discountPrice != null
          ? data.discountPrice
          : data.originalPrice || 0
      ), // Prioritize discountPrice, fallback originalPrice
      discountPrice: parseFloat(data.discountPrice || 0),
      originalPrice: parseFloat(data.originalPrice || 0),
      productId: data.productId || data._id, // Include productId if distinct from item _id
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
          `Max available stock for "${cartItem.DesignTitle}" (${cartItem.size}, ${cartItem.ProductColor}) is ${existingItem.stock}.`
        );
        return { success: false, message: "Quantity exceeds available stock." };
      }
      updatedCart[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        qty: newQuantity, // Keep if needed
      };
      toast.success(`Updated quantity for ${cartItem.DesignTitle}`);
    } else {
      if (cartItem.quantity > cartItem.stock) {
        toast.error(
          `Not enough stock for "${cartItem.DesignTitle}" (${cartItem.size}, ${cartItem.ProductColor}). Max: ${cartItem.stock}.`
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