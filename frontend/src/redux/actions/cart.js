export const CART_ACTION_TYPES = {
    UPDATE_CART: "cart/updateCart",
};

export const addToCart = (cartItem) => (dispatch, getState) => {
    try {
        const currentCart = getState().cart?.cart || [];
        const existingItemIndex = currentCart.findIndex(
            (item) =>
                item._id === cartItem._id &&
                item.size === cartItem.size &&
                item.ProductColor === cartItem.ProductColor,
        );

        let updatedCart;
        if (existingItemIndex !== -1) {
            updatedCart = [...currentCart];
            const existingItem = updatedCart[existingItemIndex];
            const newQuantity =
                Number(existingItem.quantity) + Number(cartItem.quantity);

            updatedCart[existingItemIndex] = {
                ...existingItem,
                quantity: newQuantity,
                qty: newQuantity,
            };
        } else {
            const safeItem = {
                ...cartItem,
                price: Number(cartItem.price) || 0,
                quantity: Number(cartItem.quantity) || 1,
                qty: Number(cartItem.qty) || 1,
            };
            updatedCart = [...currentCart, safeItem];
        }
        dispatch({
            type: CART_ACTION_TYPES.UPDATE_CART,
            payload: updatedCart,
        });
        localStorage.setItem("cartItems", JSON.stringify(updatedCart));
        return { success: true, cart: updatedCart };
    } catch (error) {
          console.error("Add to cart action error:", error);
          return { success: false, message: error.message };
      }
};

export const removeFromCart = (data) => (dispatch, getState) => {
    try {
        const currentCart = getState().cart?.cart || [];
        const updatedCart = currentCart.filter(
            (item) =>
                !(
                    item._id === data._id &&
                    item.size === data.size &&
                    item.ProductColor === data.ProductColor
                ),
        );
        dispatch({
            type: CART_ACTION_TYPES.UPDATE_CART,
            payload: updatedCart,
        });
        localStorage.setItem("cartItems", JSON.stringify(updatedCart));
        return { success: true, cart: updatedCart };
    } catch (error) {
        console.error("Remove from cart action error:", error);
        return { success: false };
    }
};
