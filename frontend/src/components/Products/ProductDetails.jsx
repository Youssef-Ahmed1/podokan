// /home/user/podokan/frontend/src/components/Products/ProductDetails.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTocart } from "../../redux/actions/cart";
import { addToWishlist, removeFromWishlist } from "../../redux/actions/wishlist";
import { toast } from "react-toastify";
import styles from "../../styles/styles";
import { 
  AiFillHeart, 
  AiOutlineHeart, 
  AiOutlineShareAlt 
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
import { DesignScalingManager } from '../../utils/designScaling';


const ProductDetails = ({ data }) => {
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  
  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(data?.ProductColor || "white");
  const [showBack, setShowBack] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Get design specifications from product data
  const designSpecs = data?.designSpecs || {
    position: { x: 50, y: 40 },
    scale: 0.8,
    productType: data?.ProductType || "hoodie",
    productColor: data?.ProductColor || "white",
    productView: "front",
  };

  // Update design overlay styles
  const designStyles = DesignScalingManager.getDesignStyles(
    designSpecs.position,
    designSpecs.scale,
    designSpecs.ProductColor,
    designSpecs.productView
  );

  const SizeS = ["S", "M", "L", "XL", "2XL"];
  const COLORS = data?.availableColors || ["white", "black"];

  useEffect(() => {
    if (wishlist && wishlist.find((i) => i._id === data?._id)) {
      setClick(true);
    } else {
      setClick(false);
    }
  }, [wishlist, data]);

  const getProductImage = () => {
    try {
      const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/v1728392918";
      const productType = data?.ProductType?.toLowerCase() || 'hoodie';
      const view = showBack ? 'back' : 'front';
      return `${baseUrl}/${productType}s/${productType}-${selectedColor.toLowerCase()}-${view}.png`;
    } catch (error) {
      console.error("Error getting product image:", error);
      return "";
    }
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

  const addToCartHandler = () => {
    if (!selectedSize) {
      toast.error("Please select a Size!");
      return;
    }
    
    const cartItem = {
      _id: data._id,
      DesignTitle: data.DesignTitle,
      designImage: data.designImage?.url || data.designImage,
      ProductType: data.ProductType,
      selectedColor: selectedColor,
      selectedSize: selectedSize,
      quantity: count,
      stock: data.stock || 100,
      shopId: data.shopId,
      shop: data.shop,
      originalPrice: data.originalPrice,
      discountPrice: data.discountPrice,
      price: data.discountPrice || data.originalPrice,
      // Include design specifications
      DesignScale: designSpecs.scale,
      DesignPosition: designSpecs.position,
      ProductView: designSpecs.productView
    };

    const result = dispatch(addTocart(cartItem));
    
    if (result.success) {
      toast.success("Added to cart successfully!");
    } else {
      toast.error(result.message || "Failed to add to cart");
    }
  };


  return (
    <div className="bg-white">
      {data ? (
        <div className={`${styles.section} w-[90%] 800px:w-[80%]`}>
          <div className="w-full py-5">
            <div className="block w-full 800px:flex">
              {/* Left side - Product Images */}
              <div className="w-full 800px:w-[50%]">
                <div
                  className="w-[80%] mx-auto relative"
                  style={{ aspectRatio: "3/4" }}
                >
                  {/* Product Mockup */}
                  <img
                    src={getProductImage()}
                    alt={data.DesignTitle}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error("Error loading product image");
                      e.target.src = "";
                    }}
                  />

                  {/* Design Overlay */}
                  {!showBack && data?.designImage && (
                    <div
                      className="absolute design-preview pointer-events-none"
                      style={DesignScalingManager.getConsistentContainerStyles(
                        data?.DesignPosition || { x: 50, y: 40 },
                        data?.DesignScale || 0.8,
                        selectedColor,
                        data?.ProductType || "hoodie",
                        showBack ? "back" : "front"
                      )}
                    >
                      <img
                        src={
                          typeof data.designImage === "string"
                            ? data.designImage
                            : data.designImage?.url
                        }
                        alt="Design"
                        className="w-full h-full object-contain"
                        draggable="false"
                      />
                    </div>
                  )}
                </div>

                {/* View Toggle */}
                <div className="w-[80%] mx-auto flex mt-4">
                  <button
                    className={`
                      flex-1 py-3 border-2 transition-colors
                      ${
                        !showBack
                          ? "border-[#4e64df] text-[#4e64df]"
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
                      ${
                        showBack
                          ? "border-[#4e64df] text-[#4e64df]"
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
                <h1 className="text-[25px] font-[600] font-Roboto text-gray-800">
                  {data.DesignTitle}
                </h1>

                <div className="flex items-center mt-2">
                  <span className="text-[16px] text-gray-500 mr-2">Tag:</span>
                  <span className="text-[16px] text-[#4e64df]">
                    {data.Maintag}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center mt-6">
                  <h3 className="text-[28px] font-bold text-gray-800">
                    ${data.discountPrice || data.originalPrice}
                  </h3>
                  {data.discountPrice && (
                    <>
                      <h4 className="text-[20px] text-gray-400 line-through ml-3">
                        ${data.originalPrice}
                      </h4>
                      <span className="ml-2 text-[#4e64df] text-[18px]">
                        {data.discountPercentage}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Color Selection */}
                <div className="mt-6">
                  <h4 className="text-[16px] font-[600] text-gray-800 mb-3">
                    Select Color:
                  </h4>
                  <div className="flex gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`
                          w-8 h-8 rounded-full border-2 transition-all
                          ${color === "white" ? "bg-white" : "bg-black"}
                          ${
                            selectedColor === color
                              ? "border-[#4e64df] scale-110"
                              : "border-gray-300"
                          }
                        `}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mt-6">
                  <h4 className="text-[16px] font-[600] text-gray-800 mb-3">
                    Select Size:
                  </h4>
                  <div className="flex gap-3">
                    {SizeS.map((Size) => (
                      <button
                        key={Size}
                        onClick={() => setSelectedSize(Size)}
                        className={`
                          w-14 h-10 border-2 rounded transition-colors
                          ${
                            selectedSize === Size
                              ? "border-[#4e64df] text-[#4e64df]"
                              : "border-gray-300 text-gray-600"
                          }
                        `}
                      >
                        {Size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mt-6">
                  <h4 className="text-[16px] font-[600] text-gray-800 mb-3">
                    Quantity:
                  </h4>
                  <div className="flex items-center">
                    <button
                      onClick={() => setCount((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 border rounded-l flex items-center justify-center text-gray-600"
                    >
                      -
                    </button>
                    <span className="w-12 h-8 border-t border-b flex items-center justify-center">
                      {count}
                    </span>
                    <button
                      onClick={() => setCount((prev) => prev + 1)}
                      className="w-8 h-8 border rounded-r flex items-center justify-center text-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center mt-8 gap-4">
                  <button
                    className="flex-1 py-4 bg-[#4e64df] text-white rounded-full hover:bg-[#5d71e7] transition-colors font-medium"
                    onClick={addToCartHandler}
                  >
                    Add to Cart
                  </button>

                  <button
                    onClick={handleWishlist}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {click ? (
                      <AiFillHeart className="text-[#4e64df] text-2xl" />
                    ) : (
                      <AiOutlineHeart className="text-gray-600 text-2xl" />
                    )}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowShare(!showShare)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <AiOutlineShareAlt className="text-gray-600 text-2xl" />
                    </button>

                    {showShare && (
                      <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl z-10 border border-gray-200">
                        {[
                          {
                            platform: "whatsapp",
                            icon: FaWhatsapp,
                            color: "text-green-500",
                          },
                          {
                            platform: "facebook",
                            icon: FaFacebook,
                            color: "text-blue-600",
                          },
                          {
                            platform: "twitter",
                            icon: FaTwitter,
                            color: "text-blue-400",
                          },
                          {
                            platform: "instagram",
                            icon: FaInstagram,
                            color: "text-pink-600",
                          },
                          {
                            platform: "telegram",
                            icon: FaTelegram,
                            color: "text-blue-500",
                          },
                          {
                            platform: "snapchat",
                            icon: FaSnapchat,
                            color: "text-yellow-400",
                          },
                          {
                            platform: "pinterest",
                            icon: FaPinterest,
                            color: "text-red-600",
                          },
                          {
                            platform: "linkedin",
                            icon: FaLinkedin,
                            color: "text-blue-800",
                          },
                          {
                            platform: "copy",
                            icon: IoCopy,
                            color: "text-gray-600",
                          },
                        ].map(({ platform, icon: Icon, color }) => (
                          <button
                            key={platform}
                            onClick={() => handleShare(platform)}
                            className="flex items-center px-4 py-2 hover:bg-gray-50 w-full"
                          >
                            <Icon className={`mr-3 ${color}`} />
                            <span className="capitalize text-gray-700">
                              {platform}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {data.Description && (
                  <div className="mt-8">
                    <h4 className="text-[16px] font-[600] text-gray-800 mb-2">
                      Description:
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {data.Description}
                    </p>
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