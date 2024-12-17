import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AiFillHeart, AiOutlineHeart, AiOutlineShoppingCart } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "../../../redux/actions/wishlist";
import { addTocart } from "../../../redux/actions/cart";
import { toast } from "react-toastify";
const ProductCard = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);
  const dispatch = useDispatch();
  const { cart } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist);

  const getDesignImage = () => {
    if (data?.designImage) {
      return typeof data.designImage === 'string' ? data.designImage : data.designImage.url;
    }
    return '';
  };

  return (
    <div className="card group h-full">
      <Link to={`/product/${data._id}`}>
        <div 
          className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            src={getDesignImage()}
            alt={data.DesignTitle || "Product Design"}
            className="w-full h-full object-cover transition-all duration-500
              group-hover:scale-110"
            loading="lazy"
          />

          {/* Product Info Overlay */}
          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center
            transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="p-4 text-center">
              <h3 className={styles.productTitle + " text-white mb-2"}>
                {data.DesignTitle || "Untitled Design"}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <span className={styles.productDiscountPrice + " text-white"}>
                  £{parseFloat(data.discountPrice || data.originalPrice).toFixed(2)}
                </span>
                {data.originalPrice && data.discountPrice && (
                  <span className={styles.price + " text-white/60"}>
                    £{parseFloat(data.originalPrice).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`absolute top-4 right-4 flex flex-col gap-2
            transition-all duration-300 ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <button className={styles.cart_button}>
              <span className={styles.cart_button_text}>
                Add to Cart
              </span>
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};



export default ProductCard;