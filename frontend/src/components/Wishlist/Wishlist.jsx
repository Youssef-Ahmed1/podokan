// components/Wishlist/Wishlist.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross1 } from "react-icons/rx";
import { BsCartPlus } from "react-icons/bs";
import { AiOutlineHeart } from "react-icons/ai";
import styles from "../../styles/styles";
import { useDispatch, useSelector } from "react-redux";
import { removeFromWishlist } from "../../redux/actions/wishlist";
import { addToCart } from "../../redux/actions/cart";

const Wishlist = ({ setOpenWishlist }) => {
  const { wishlist } = useSelector((state) => state.wishlist);
  const dispatch = useDispatch();

  const removeFromWishlistHandler = (data) => {
    dispatch(removeFromWishlist(data));
  };

  const addToCartHandler = (data) => {
    dispatch(addToCart({ ...data, qty: 1 }));
    setOpenWishlist(false);
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
        onClick={() => setOpenWishlist(false)}
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
          {wishlist.length === 0 ? (
            <EmptyWishlist setOpenWishlist={setOpenWishlist} />
          ) : (
            <FilledWishlist
              wishlist={wishlist}
              setOpenWishlist={setOpenWishlist}
              removeFromWishlistHandler={removeFromWishlistHandler}
              addToCartHandler={addToCartHandler}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const EmptyWishlist = ({ setOpenWishlist }) => (
  <div className="h-full flex flex-col items-center justify-center p-4">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="w-24 h-24 mb-4"
    >
      <AiOutlineHeart className="w-full h-full text-gray-300" />
    </motion.div>
    <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
    <p className="text-gray-500 text-center mb-6">
      Save items you love for later
    </p>
    <button
      onClick={() => setOpenWishlist(false)}
      className="px-6 py-2 bg-[#e44343] text-white rounded-full hover:bg-[#d03e3e] transition-colors"
    >
      Continue Shopping
    </button>
  </div>
);

const FilledWishlist = ({
  wishlist,
  setOpenWishlist,
  removeFromWishlistHandler,
  addToCartHandler
}) => (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        <AiOutlineHeart className="w-6 h-6 mr-2" />
        <h2 className="text-lg font-medium">{wishlist.length} items</h2>
      </div>
      <button
        onClick={() => setOpenWishlist(false)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <RxCross1 className="w-5 h-5" />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto">
      <AnimatePresence>
        {wishlist.map((item, index) => (
          <WishlistItem
            key={index}
            data={item}
            removeFromWishlistHandler={removeFromWishlistHandler}
            addToCartHandler={addToCartHandler}
          />
        ))}
      </AnimatePresence>
    </div>
  </div>
);

const WishlistItem = ({ data, removeFromWishlistHandler, addToCartHandler }) => (
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
          onClick={() => removeFromWishlistHandler(data)}
          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full
            hover:bg-red-600 transition-colors"
        >
          <RxCross1 className="w-3 h-3" />
        </motion.button>
      </div>

      <div className="flex-1 ml-4">
        <h3 className="font-medium mb-1">{data.DesignTitle}</h3>
        <div className="text-[#d02222] font-medium mb-2">
          EGP {data.discountPrice || data.originalPrice}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => addToCartHandler(data)}
          className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg
            hover:bg-gray-200 transition-colors"
        >
          <BsCartPlus className="w-4 h-4" />
          <span className="text-sm">Add to cart</span>
        </motion.button>
      </div>
    </div>
  </motion.div>
);

export default Wishlist;
