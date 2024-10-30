import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AiFillHeart, AiOutlineHeart, AiOutlineShoppingCart } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "../../../redux/actions/wishlist";
import { addTocart } from "../../../redux/actions/cart";
import { toast } from "react-toastify";

const ProductCard = ({ data, isEvent }) => {
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const [click, setClick] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (wishlist && data && wishlist.find((i) => i._id === data._id)) {
      setClick(true);
    } else {
      setClick(false);
    }
  }, [wishlist, data]);

  const removeFromWishlistHandler = (data) => {
    setClick(!click);
    dispatch(removeFromWishlist(data));
  };

  const addToWishlistHandler = (data) => {
    setClick(!click);
    dispatch(addToWishlist(data));
  };

  const addToCartHandler = (id) => {
    const isItemExists = cart && cart.find((i) => i._id === id);
    if (isItemExists) {
      toast.error("Item already in cart!");
    } else {
      if (data.stock < 1) {
        toast.error("Product stock limited!");
      } else {
        const cartData = { ...data, qty: 1 };
        dispatch(addTocart(cartData));
        toast.success("Item added to cart successfully!");
      }
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  const getDesignImage = () => {
    if (data && data.designImage) {
      if (typeof data.designImage === 'string') {
        return data.designImage;
      } else if (data.designImage.url) {
        return data.designImage.url;
      }
    }
    return '';
  };

  const discountPercentage = data.originalPrice && data.discountPrice
    ? Math.round((1 - data.discountPrice / data.originalPrice) * 100)
    : 0;

  return (
    <div className="relative group">
      <Link to={`${isEvent === true ? `/product/${data._id}?isEvent=true` : `/product/${data._id}`}`}>
        <div 
          className="relative w-full aspect-square overflow-hidden bg-gray-100"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            src={getDesignImage()}
            alt={data.DesignTitle || "Product Design"}
            className="w-full h-full object-contain transition-all duration-300 group-hover:scale-110"
            style={{ 
              transform: `scale(${data.DesignScale || 1})`,
            }}
          />
        </div>
      </Link>
      
      {discountPercentage > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
          {discountPercentage}% OFF
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h4 className="text-white font-semibold truncate">{data.DesignTitle || "Unnamed Product"}</h4>
        <div className="flex items-center justify-between mt-2">
          <p className="text-white font-bold">
            £{formatPrice(data.discountPrice || data.originalPrice)}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                addToCartHandler(data._id);
              }}
              className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
            >
              <AiOutlineShoppingCart size={20} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                click ? removeFromWishlistHandler(data) : addToWishlistHandler(data);
              }}
              className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
            >
              {click ? <AiFillHeart size={20} color="red" /> : <AiOutlineHeart size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;