import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross1 } from "react-icons/rx";
import { IoBagHandleOutline } from "react-icons/io5";
import { HiOutlineMinus, HiPlus } from "react-icons/hi";
import styles from "../../styles/styles";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addTocart, removeFromCart } from "../../redux/actions/cart";
import { toast } from "react-toastify";

const Cart = ({ setOpenCart }) => {
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const removeFromCartHandler = (data) => {
    dispatch(removeFromCart(data));
  };

  const totalPrice = cart.reduce(
    (acc, item) => acc + item.qty * item.discountPrice,
    0
  );

  const quantityChangeHandler = (data) => {
    dispatch(addTocart(data));
  };

  const slideVariants = {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setOpenCart(false)}
      >
        <motion.div
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: "tween", duration: 0.3 }}
          className="fixed top-0 right-0 h-full w-[80%] 800px:w-[25%] bg-white shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {cart.length === 0 ? (
            <EmptyCart setOpenCart={setOpenCart} />
          ) : (
            <FilledCart
              cart={cart}
              setOpenCart={setOpenCart}
              totalPrice={totalPrice}
              quantityChangeHandler={quantityChangeHandler}
              removeFromCartHandler={removeFromCartHandler}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const EmptyCart = ({ setOpenCart }) => (
  <div className="h-full flex flex-col items-center justify-center p-4">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="w-24 h-24 mb-4"
    >
      <IoBagHandleOutline className="w-full h-full text-gray-300" />
    </motion.div>
    <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
    <p className="text-gray-500 text-center mb-6">
      Looks like you haven't added any items to your cart yet
    </p>
    <button
      onClick={() => setOpenCart(false)}
      className="px-6 py-2 bg-[#e44343] text-white rounded-full hover:bg-[#d03e3e] transition-colors"
    >
      Continue Shopping
    </button>
  </div>
);

const FilledCart = ({
  cart,
  setOpenCart,
  totalPrice,
  quantityChangeHandler,
  removeFromCartHandler
}) => (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        <IoBagHandleOutline className="w-6 h-6 mr-2" />
        <h2 className="text-lg font-medium">{cart.length} items</h2>
      </div>
      <button
        onClick={() => setOpenCart(false)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <RxCross1 className="w-5 h-5" />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto">
      <AnimatePresence>
        {cart.map((item, index) => (
          <CartItem
            key={index}
            data={item}
            quantityChangeHandler={quantityChangeHandler}
            removeFromCartHandler={removeFromCartHandler}
          />
        ))}
      </AnimatePresence>
    </div>

    <div className="p-4 border-t">
      <div className="flex justify-between mb-4">
        <span className="text-gray-600">Total</span>
        <span className="font-medium">EGP {totalPrice.toFixed(2)}</span>
      </div>
      <Link to="/checkout">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-[#e44343] text-white rounded-lg font-medium
            hover:bg-[#d03e3e] transition-colors"
        >
          Checkout Now
        </motion.button>
      </Link>
    </div>
  </div>
);

const CartItem = ({ data, quantityChangeHandler, removeFromCartHandler }) => {
  const [value, setValue] = useState(data.qty);

  const handleIncrement = () => {
    if (data.stock > value) {
      setValue(value + 1);
      quantityChangeHandler({ ...data, qty: value + 1 });
    } else {
      toast.error("Product stock limited!");
    }
  };

  const handleDecrement = () => {
    if (value > 1) {
      setValue(value - 1);
      quantityChangeHandler({ ...data, qty: value - 1 });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 border-b"
    >
      <div className="flex items-start">
        <div className="relative flex-shrink-0">
          <img
            src={data.designImage?.url || data.designImage}
            alt={data.DesignTitle}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => removeFromCartHandler(data)}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full
              hover:bg-red-600 transition-colors"
          >
            <RxCross1 className="w-3 h-3" />
          </motion.button>
        </div>

        <div className="flex-1 ml-4">
          <h3 className="font-medium mb-1">{data.DesignTitle}</h3>
          <div className="flex items-center mb-2">
            <div className="flex items-center border rounded-lg">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDecrement}
                className="p-1 hover:bg-gray-100"
              >
                <HiOutlineMinus className="w-4 h-4" />
              </motion.button>
              <span className="px-3 py-1 border-x">{value}</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleIncrement}
                className="p-1 hover:bg-gray-100"
              >
                <HiPlus className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
          <div className="text-[#d02222] font-medium">
            EGP {(data.discountPrice * value).toFixed(2)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Cart;