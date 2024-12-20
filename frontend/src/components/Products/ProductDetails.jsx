import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTocart } from "../../redux/actions/cart";
import { addToWishlist, removeFromWishlist } from "../../redux/actions/wishlist";
import { toast } from "react-toastify";
import Ratings from "../Ratings/Ratings";
import styles from "../../styles/styles";
import { 
  AiFillHeart, 
  AiOutlineHeart, 
  AiOutlineShoppingCart
} from "react-icons/ai";
import { 
  FaFacebook, 
  FaTwitter, 
  FaPinterest, 
  FaLinkedin, 
  FaInstagram, 
  FaTelegram, 
  FaSnapchat,
  FaWhatsapp
} from "react-icons/fa";
import { IoCopy } from "react-icons/io5";

const ProductDetails = ({ data }) => {
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  
  // States
  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("white");
  const [showBack, setShowBack] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Available sizes
  const SIZES = ["S", "M", "L", "XL", "2XL"];
  const COLORS = ["white", "black"];

  useEffect(() => {
    if (wishlist && wishlist.find((i) => i._id === data?._id)) {
      setClick(true);
    } else {
      setClick(false);
    }
  }, [wishlist, data]);

  const getProductImage = () => {
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    return `${baseUrl}/${data.ProductType.toLowerCase()}/${selectedColor.toLowerCase()}/${
      showBack ? 'back' : 'front'
    }.png`;
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    if (click) {
      setClick(!click);
      dispatch(removeFromWishlist(data));
      toast.success("Removed from wishlist!");
    } else {
      setClick(!click);
      dispatch(addToWishlist(data));
      toast.success("Added to wishlist!");
    }
  };

  const handleShare = (platform) => {
    const text = encodeURIComponent(`Check out ${data.DesignTitle}!`);
    const url = encodeURIComponent(window.location.href);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'instagram':
        shareUrl = `https://instagram.com/share?url=${url}`;
        break;
      case 'snapchat':
        shareUrl = `https://www.snapchat.com/share?url=${url}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
        return;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const decrementCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  const incrementCount = () => {
    setCount(count + 1);
  };

  const addToCartHandler = () => {
    if (!selectedSize) {
      toast.error("Please select a size!");
      return;
    }
    
    if (cart && cart.find((i) => i._id === data?._id)) {
      toast.error("Item already in cart!");
      return;
    }

    const cartData = {
      ...data,
      qty: count,
      selectedSize,
      selectedColor,
    };

    dispatch(addTocart(cartData));
    toast.success("Added to cart successfully!");
  };

  return (
    <div className="bg-white">
      {data ? (
        <div className={`${styles.section} w-[90%] 800px:w-[80%]`}>
          <div className="w-full py-5">
            <div className="block w-full 800px:flex">
              {/* Left side - Product Images */}
              <div className="w-full 800px:w-[50%]">
                <div className="w-[80%] mx-auto relative">
                  <img
                    src={getProductImage()}
                    alt={data.DesignTitle}
                    className="w-full h-auto object-contain"
                  />
                  {!showBack && data.designImage && (
                    <div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        width: `${(data.DesignScale || 1) * 40}%`,
                        maxWidth: '60%'
                      }}
                    >
                      <img
                        src={data.designImage.url}
                        alt="Design"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* View Toggle */}
                <div className="w-[80%] mx-auto flex mt-4">
                  <button
                    className={`
                      flex-1 py-3 border-2 transition-colors
                      ${!showBack 
                        ? "border-[#f63b60] text-[#f63b60]" 
                        : "border-gray-300 text-gray-600"
                      }
                    `}
                    onClick={() => setShowBack(false)}
                  >
                    Front View
                  </button>
                  <button
                    className={`
                      flex-1 py-3 border-2 transition-colors
                      ${showBack 
                        ? "border-[#f63b60] text-[#f63b60]" 
                        : "border-gray-300 text-gray-600"
                      }
                    `}
                    onClick={() => setShowBack(true)}
                  >
                    Back View
                  </button>
                </div>
              </div>

              {/* Right side - Product Details */}
              <div className="w-full 800px:w-[50%] pt-5 pl-[30px]">
                <h1 className="text-[25px] font-[600] font-Roboto text-[#333]">
                  {data.DesignTitle}
                </h1>
                <p className="text-[16px] text-[#000000a4] font-[400] mt-2">
                  Design #{data.DesignNumber}
                </p>

                {/* Tags */}
                {data.Designtags && data.Designtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {data.Designtags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center mt-6">
                  <h3 className="text-[28px] font-bold text-[#333]">
                    ${data.discountPrice || data.originalPrice}
                  </h3>
                  {data.discountPrice && (
                    <>
                      <h4 className="text-[20px] text-[#666] line-through ml-3">
                        ${data.originalPrice}
                      </h4>
                      <span className="ml-2 text-green-500 text-[18px]">
                        {Math.round(((data.originalPrice - data.discountPrice) / data.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Color Selection */}
                <div className="mt-6">
                  <h4 className="text-[16px] font-[600] mb-3">Select Color:</h4>
                  <div className="flex gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`
                          w-8 h-8 rounded-full border-2 transition-all
                          ${color === 'white' ? 'bg-white' : 'bg-black'}
                          ${selectedColor === color 
                            ? 'border-[#f63b60] scale-110' 
                            : 'border-gray-300'
                          }
                        `}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mt-6">
                  <h4 className="text-[16px] font-[600] mb-3">Select Size:</h4>
                  <div className="flex gap-3">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`
                          w-14 h-10 border-2 rounded transition-colors
                          ${selectedSize === size 
                            ? 'border-[#f63b60] text-[#f63b60]' 
                            : 'border-gray-300 text-gray-600'
                          }
                          hover:border-[#f63b60] hover:text-[#f63b60]
                        `}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mt-6">
                  <h4 className="text-[16px] font-[600] mb-3">Quantity:</h4>
                  <div className="flex items-center">
                    <button 
                      onClick={decrementCount}
                      className="w-8 h-8 border rounded-l flex items-center justify-center hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-12 h-8 border-t border-b flex items-center justify-center">
                      {count}
                    </span>
                    <button 
                      onClick={incrementCount}
                      className="w-8 h-8 border rounded-r flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center mt-8 gap-4">
                  <button
                    className="flex-1 py-4 bg-[#f63b60] text-white rounded-full hover:bg-[#e63956] transition-colors"
                    onClick={addToCartHandler}
                  >
                    Add to Cart
                  </button>
                  
                  <button
                    onClick={handleWishlist}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {click ? (
                      <AiFillHeart className="text-[#f63b60] text-2xl" />
                    ) : (
                      <AiOutlineHeart className="text-2xl" />
                    )}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowShare(!showShare)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <IoCopy className="text-xl" />
                    </button>

                    {showShare && (
                      <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl z-10">
                        {[
                          { platform: 'whatsapp', icon: FaWhatsapp, color: 'text-green-500' },
                          { platform: 'facebook', icon: FaFacebook, color: 'text-blue-600' },
                          { platform: 'twitter', icon: FaTwitter, color: 'text-blue-400' },
                          { platform: 'instagram', icon: FaInstagram, color: 'text-pink-600' },
                          { platform: 'telegram', icon: FaTelegram, color: 'text-blue-500' },
                          { platform: 'snapchat', icon: FaSnapchat, color: 'text-yellow-400' },
                          { platform: 'pinterest', icon: FaPinterest, color: 'text-red-600' },
                          { platform: 'linkedin', icon: FaLinkedin, color: 'text-blue-800' },
                          { platform: 'copy', icon: IoCopy, color: 'text-gray-600' }
                        ].map(({ platform, icon: Icon, color }) => (
                          <button
                            key={platform}
                            onClick={() => handleShare(platform)}
                            className="flex items-center px-4 py-2 hover:bg-gray-100 w-full"
                          >
                            <Icon className={`mr-3 ${color}`} />
                            <span className="capitalize">{platform}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {data.Description && (
                  <div className="mt-8">
                    <h4 className="text-[16px] font-[600] mb-2">Description:</h4>
                    <p className="text-[#000000a4]">{data.Description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductDetails;