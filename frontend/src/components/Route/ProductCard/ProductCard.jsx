import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../../../styles/styles";
import { AiFillHeart, AiOutlineEye, AiOutlineHeart, AiOutlineShoppingCart } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import ProductDetailsCard from "../ProductDetailsCard/ProductDetailsCard";
import { addToWishlist, removeFromWishlist } from "../../../redux/actions/wishlist";
import { addTocart } from "../../../redux/actions/cart";
import { toast } from "react-toastify";
import Ratings from "../../Products/Ratings";

const ProductCard = ({ data, isEvent }) => {
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const [click, setClick] = useState(false);
  const [open, setOpen] = useState(false);
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

  const getMockupUrl = () => {
    if (!data) return '';
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    let version, folder, filename;
    
    switch (data.ProductType) {
      case "hoodie":
        version = "v1728392918";
        folder = "hoodies";
        filename = `hoodie-${data.ProductColor}-front`;
        break;
      case "t-shirt":
        version = "v1728393898";
        folder = "t-shirts";
        filename = `t-shirt-${data.ProductColor}-front`;
        break;
      case "long-sleeve":
        version = "v1728394669";
        folder = "long-sleeves";
        if (data.ProductColor === "gray") {
          filename = `longsleeves-${data.ProductColor}-front`;
        } else {
          filename = `t-shirt-${data.ProductColor}-front`;
        }
        break;
      default:
        return "";
    }

    return `${baseUrl}${version}/${folder}/${filename}.png`;
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

  return (
    <div 
      className="w-full h-[370px] bg-[#333] rounded-lg shadow-md relative cursor-pointer overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {data.isBestSeller && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-sm z-10">
          Best Seller
        </div>
      )}
      <Link to={`${isEvent === true ? `/product/${data._id}?isEvent=true` : `/product/${data._id}`}`}>
        <div className="relative w-full h-[280px] flex items-center justify-center">
          <img
            src={getDesignImage()}
            alt={data.DesignTitle || "Product Design"}
            className="w-3/4 h-3/4 object-contain transition-opacity duration-700"
            style={{ opacity: isHovered ? 0 : 1 }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-700"
            style={{ opacity: isHovered ? 1 : 0 }}
          >
            <img
              src={getMockupUrl()}
              alt={data.DesignTitle || "Product Mockup"}
              className="w-full h-full object-cover"
            />
            <img
              src={getDesignImage()}
              alt={data.DesignTitle || "Product Design"}
              className="absolute w-1/2 h-1/2 object-contain"
              style={{ 
                transform: `scale(${data.DesignScale || 1})`,
              }}
            />
          </div>
        </div>
      </Link>
      <div className="absolute bottom-0 left-0 right-0 bg-[#222] p-4">
        <h4 className="text-white font-semibold truncate">
          {data.DesignTitle || "Unnamed Product"}
        </h4>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center mt-2">
            <p className="text-orange-500 font-bold text-xl">
              £{formatPrice(data.discountPrice || data.originalPrice)}
            </p>
            {data.discountPrice && data.originalPrice && data.discountPrice < data.originalPrice && (
              <p className="text-gray-400 line-through ml-2">
                £{formatPrice(data.originalPrice)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => addToCartHandler(data._id)}
              className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-colors duration-300"
            >
              <AiOutlineShoppingCart size={20} />
            </button>
            <button
              onClick={() => click ? removeFromWishlistHandler(data) : addToWishlistHandler(data)}
              className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-colors duration-300"
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