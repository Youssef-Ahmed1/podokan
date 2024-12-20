import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTocart } from "../../redux/actions/cart";
import { addToWishlist, removeFromWishlist } from "../../redux/actions/wishlist";
import { toast } from "react-toastify";
import Ratings from "../../components/Products/Ratings";
import styles from "../../styles/styles";
import { 
  AiFillHeart, 
  AiOutlineHeart, 
  AiOutlineShoppingCart, 
  AiOutlineShareAlt 
} from "react-icons/ai";
import { 
  FaFacebook, 
  FaTwitter, 
  FaPinterest, 
  FaLinkedin, 
  FaInstagram, 
  FaTelegram, 
  FaSnapchat 
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
  const [selectedColor, setSelectedColor] = useState(data?.ProductColor || "white");
  const [showBack, setShowBack] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  // Constants
  const SIZES = ["S", "M", "L", "XL", "2XL"];
  const VALID_COLORS = ["white", "black"];

  useEffect(() => {
    if (wishlist && wishlist.find((i) => i._id === data?._id)) {
      setClick(true);
    } else {
      setClick(false);
    }
  }, [wishlist, data]);

  // Status badge component
  const StatusBadge = ({ status, visibility }) => {
    const getStatusStyle = (status) => {
      switch (status) {
        case 'public':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'rejected':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="flex gap-2">
        <span className={`px-3 py-1 rounded-full text-sm ${getStatusStyle(status)}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {visibility === 'restricted' && (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
            Restricted
          </span>
        )}
      </div>
    );
  };

  // Handlers
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

  const shareUrl = window.location.href;
  const handleShare = (platform) => {
    let shareLink = '';
    const text = `Check out ${data.DesignTitle} on our store!`;
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'pinterest':
        shareLink = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'instagram':
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied! Share it on Instagram");
        return;
      case 'snapchat':
        shareLink = `https://www.snapchat.com/share?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
        return;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white">
      {data ? (
        <div className={`${styles.section} w-[90%] 800px:w-[80%]`}>
          <div className="w-full py-5">
            <div className="block w-full 800px:flex">
              {/* Left side - Product Images */}
              <div className="w-full 800px:w-[50%] relative">
                <div className="w-[80%] mx-auto">
                  <img
                    src={`${data.ProductType.toLowerCase()}/${selectedColor.toLowerCase()}/${
                      showBack ? 'back' : 'front'
                    }.png`}
                    alt={data.DesignTitle}
                    className="w-full h-auto object-contain"
                  />
                  {!showBack && data.designImage && (
                    <div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        width: `${(data.DesignScale || 1) * 40}%`,
                        height: 'auto'
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
                  <div
                    className={`${
                      !showBack ? "border-[3px] border-[#f63b60]" : "border"
                    } cursor-pointer p-3 flex-1 text-center`}
                    onClick={() => setShowBack(false)}
                  >
                    Front View
                  </div>
                  <div
                    className={`${
                      showBack ? "border-[3px] border-[#f63b60]" : "border"
                    } cursor-pointer p-3 flex-1 text-center`}
                    onClick={() => setShowBack(true)}
                  >
                    Back View
                  </div>
                </div>
              </div>

              {/* Right side - Product Details */}
              <div className="w-full 800px:w-[50%] pt-5 px-4">
                <div className="flex justify-between items-start">
                  <div>
                    <StatusBadge status={data.status} visibility={data.visibility} />
                    <h1 className="text-2xl font-bold mt-3">{data.DesignTitle}</h1>
                    <p className="text-gray-600 mt-1">Design #{data.DesignNumber}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleWishlist}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      {click ? (
                        <AiFillHeart className="text-red-500 text-xl" />
                      ) : (
                        <AiOutlineHeart className="text-xl" />
                      )}
                    </button>

                    <div className="relative">
                    <button
  onClick={() => setShowShare(!showShare)}
  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
>
  <AiOutlineShareAlt className="text-xl" /> 
</button>

                      {showShare && (
                        <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl z-10">
                          {[
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
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {data.Maintag && (
                    <span className="px-3 py-1 bg-[#f63b60] text-white rounded-full text-sm">
                      {data.Maintag}
                    </span>
                  )}
                  {data.Designtags?.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <div className="mt-4">
                  <p className="text-gray-600">{data.Description}</p>
                </div>

                {/* Price */}
                <div className="mt-6 flex items-center">
                  <span className="text-3xl font-bold">
                    ${data.discountPrice || data.originalPrice}
                  </span>
                  {data.discountPrice && (
                    <>
                      <span className="ml-2 text-xl text-gray-500 line-through">
                        ${data.originalPrice}
                      </span>
                      <span className="ml-2 text-green-500">
                        {Math.round(((data.originalPrice - data.discountPrice) / data.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Color Selection */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Color</h3>
                  <div className="flex gap-3">
                    {VALID_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`
                          w-8 h-8 rounded-full border-2
                          ${color === 'white' ? 'bg-white' : 'bg-black'}
                          ${selectedColor === color ? 'border-[#f63b60]' : 'border-gray-300'}
                        `}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Size</h3>
                  <div className="flex gap-3">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`
                          w-14 h-10 border rounded
                          ${selectedSize === size 
                            ? 'border-[#f63b60] text-[#f63b60]' 
                            : 'border-gray-300'
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
                  <h3 className="text-lg font-semibold mb-2">Quantity</h3>
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

                {/* Add to Cart */}
                <button
                  onClick={addToCartHandler}
                  className={`
                    w-full py-3 px-6 mt-6 rounded
                    ${data.status === 'public' && data.visibility === 'public'
                      ? 'bg-[#f63b60] text-white hover:bg-[#e63956]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                  disabled={data.status !== 'public' || data.visibility !== 'public'}
                >
                  Add to Cart
                </button>

                {/* Reviews */}
                {data.reviews && data.reviews.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Reviews ({data.reviews.length})
                      </h3>
                      <button
                        onClick={() => setShowReviews(!showReviews)}
                        className="text-[#f63b60]"
                      >
                        {showReviews ? 'Hide Reviews' : 'Show Reviews'}
                      </button>
                    </div>

                    {showReviews && (
                      <div className="space-y-4">
                        {data.reviews.map((review, index) => (
                          <div key={index} className="border-b pb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{review.name}</p>
                                <Ratings rating={review.rating} />
                              </div>
                              <span className="text-gray-500 text-sm">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                            <p className="mt-2 text-gray-600">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
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