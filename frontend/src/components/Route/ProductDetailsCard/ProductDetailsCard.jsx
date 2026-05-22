import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { addToCart } from "../../../redux/actions/cart";
import Ratings from "../../../components/Products/Ratings";
import { motion } from "framer-motion";
import styles from "../../styles/styles";

const ProductDetailsCard = ({ data }) => {
  const [selectedColor, setSelectedColor] = useState(data.ProductColor);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showBack, setShowBack] = useState(false);
  const dispatch = useDispatch();

  // Validate if product can be purchased
  const canPurchase = data.status === 'public' && data.visibility === 'public';

  // Get current stock status
  const isInStock = data.sold_out < 999999; // Using your model's virtual
  const stockWarning = data.sold_out >= (data.stockWarningLevel || 4);

  const handleColorChange = (color) => {
    setSelectedColor(color);
    // Reset view to front when color changes
    setShowBack(false);
  };

  const handleQuantityChange = (newQuantity) => {
    // Ensure quantity doesn't exceed available stock
    const maxAvailable = 999999 - data.sold_out;
    const validQuantity = Math.min(Math.max(1, newQuantity), maxAvailable);
    setQuantity(validQuantity);
  };

  const handleaddToCart = async () => {
      if (!canPurchase) {
          toast.error("This product is not available for purchase");
          return;
      }

      if (!selectedSize) {
          toast.error("Please select a size!");
          return;
      }

      if (!isInStock) {
          toast.error("Product is out of stock!");
          return;
      }

      const cartData = {
          _id: data._id,
          DesignTitle: data.DesignTitle,
          designImage: data.designImage,
          ProductType: data.ProductType,
          ProductColor: selectedColor,
          selectedSize,
          quantity,
          shopId: data.shopId,
          shop: data.shop,
          discountPrice: data.discountPrice || data.originalPrice,
          originalPrice: data.originalPrice,
      };

      try {
          const result = await dispatch(addToCart(cartData));
          if (result.success) {
              toast.success("Added to cart successfully!");
          } else {
              toast.error(result.message || "Failed to add to cart");
          }
      } catch (error) {
          toast.error("Something went wrong. Please try again.");
      }
  };

  return (
      <div className={`${styles.section} w-[90%] 800px:w-[80%]`}>
          <div className="w-full py-5">
              <div className="block w-full 800px:flex">
                  {/* Product Image Section */}
                  <div className="w-full 800px:w-[50%]">
                      <div className="w-full relative">
                          <img
                              src={`/products/${data.ProductType.toLowerCase()}/${selectedColor.toLowerCase()}/${
                                  showBack ? "back" : "front"
                              }.png`}
                              alt={`${data.DesignTitle} ${showBack ? "back" : "front"} view`}
                              className="w-full h-auto"
                          />
                          {/* Design overlay only on front view */}
                          {!showBack && data.designImage && (
                              <div
                                  className="absolute"
                                  style={{
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                      width: `${(data.DesignScale || 1) * 40}%`,
                                      height: "auto",
                                  }}
                              >
                                  <img
                                      src={data.designImage.url}
                                      alt="Design"
                                      className="w-full h-full object-contain"
                                  />
                              </div>
                          )}
                          <div className="w-full flex">
                              <div
                                  className={`${
                                      showBack
                                          ? "border"
                                          : "border-[3px] border-[#f63b60]"
                                  } cursor-pointer p-3`}
                                  onClick={() => setShowBack(false)}
                              >
                                  Front View
                              </div>
                              <div
                                  className={`${
                                      showBack
                                          ? "border-[3px] border-[#f63b60]"
                                          : "border"
                                  } cursor-pointer p-3`}
                                  onClick={() => setShowBack(true)}
                              >
                                  Back View
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Product Details Section */}
                  <div className="w-full 800px:w-[50%] pt-5 pl-[5px] pr-[5px]">
                      <h1 className={`${styles.productTitle}`}>
                          {data.DesignTitle}
                      </h1>
                      <p className="mt-2 text-gray-600">{data.Description}</p>

                      {/* Ratings */}
                      {data.ratings > 0 && (
                          <div className="flex items-center mt-4">
                              <Ratings rating={data.ratings} />
                              <span className="ml-2 text-gray-600">
                                  ({data.reviews?.length || 0} reviews)
                              </span>
                          </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center mt-6">
                          <span className="text-3xl font-bold text-[#333]">
                              ${data.discountPrice || data.originalPrice}
                          </span>
                          {data.discountPrice && data.originalPrice && (
                              <>
                                  <span className="ml-3 text-lg text-gray-500 line-through">
                                      ${data.originalPrice}
                                  </span>
                                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                      {Math.round(
                                          ((data.originalPrice -
                                              data.discountPrice) /
                                              data.originalPrice) *
                                              100,
                                      )}
                                      % OFF
                                  </span>
                              </>
                          )}
                      </div>

                      {/* Stock Status */}
                      {!isInStock ? (
                          <div className="mt-4 text-red-600 font-medium">
                              Out of Stock
                          </div>
                      ) : stockWarning ? (
                          <div className="mt-4 text-orange-600">
                              Only a few items left!
                          </div>
                      ) : null}

                      {/* Color Selection */}
                      <div className="mt-6">
                          <h3 className="text-sm font-medium text-gray-900">
                              Color
                          </h3>
                          <div className="mt-2 flex gap-2">
                              {data.availableColors.map((color) => (
                                  <button
                                      key={color}
                                      onClick={() => handleColorChange(color)}
                                      className={`w-8 h-8 rounded-full border-2 ${
                                          selectedColor === color
                                              ? "border-[#f63b60]"
                                              : "border-gray-200"
                                      }`}
                                      style={{
                                          backgroundColor: color.toLowerCase(),
                                      }}
                                  />
                              ))}
                          </div>
                      </div>

                      {/* size Selection */}
                      <div className="mt-6">
                          <h3 className="text-sm font-medium text-gray-900">
                              size
                          </h3>
                          <div className="mt-2 grid grid-cols-5 gap-2">
                              {["S", "M", "L", "XL", "2XL"].map((size) => (
                                  <button
                                      key={size}
                                      onClick={() => setSelectedSize(size)}
                                      className={`py-2 text-sm font-medium rounded-md ${
                                          selectedSize === size
                                              ? "bg-[#f63b60] text-white"
                                              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                      }`}
                                  >
                                      {size}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Quantity */}
                      <div className="mt-6">
                          <h3 className="text-sm font-medium text-gray-900">
                              Quantity
                          </h3>
                          <div className="mt-2 flex items-center gap-2">
                              <button
                                  onClick={() =>
                                      handleQuantityChange(quantity - 1)
                                  }
                                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                              >
                                  -
                              </button>
                              <input
                                  type="number"
                                  value={quantity}
                                  onChange={(e) =>
                                      handleQuantityChange(
                                          parseInt(e.target.value) || 1,
                                      )
                                  }
                                  className="w-16 text-center border rounded-md"
                                  min="1"
                                  max={999999 - data.sold_out}
                              />
                              <button
                                  onClick={() =>
                                      handleQuantityChange(quantity + 1)
                                  }
                                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                              >
                                  +
                              </button>
                          </div>
                      </div>

                      {/* Add to Cart Button */}
                      <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleaddToCart}
                          disabled={!canPurchase || !isInStock}
                          className={`w-full py-3 mt-6 rounded-lg font-medium ${
                              !canPurchase || !isInStock
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-[#f63b60] hover:bg-[#f63b60]/90 text-white"
                          }`}
                      >
                          {!canPurchase
                              ? "Not Available"
                              : !isInStock
                                ? "Out of Stock"
                                : "Add to Cart"}
                      </motion.button>

                      {/* Product Status Messages */}
                      {data.status === "rejected" && data.rejectionReason && (
                          <div className="mt-4 p-4 bg-red-50 rounded-lg">
                              <h4 className="text-red-800 font-medium">
                                  Rejection Reason:
                              </h4>
                              <p className="text-red-600 mt-1">
                                  {data.rejectionReason}
                              </p>
                          </div>
                      )}

                      {/* Additional Product Info */}
                      <div className="mt-6 border-t pt-6">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>Product Type:</span>
                              <span>{data.ProductType}</span>
                          </div>
                          {data.sold_out > 0 && (
                              <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                                  <span>Sold:</span>
                                  <span>{data.sold_out} items</span>
                              </div>
                          )}
                          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                              <span>Last Updated:</span>
                              <span>
                                  {new Date(
                                      data.lastModified,
                                  ).toLocaleDateString()}
                              </span>
                          </div>
                      </div>

                      {/* Reviews Section */}
                      {data.reviews?.length > 0 && (
                          <div className="mt-8 border-t pt-8">
                              <h3 className="text-lg font-medium mb-4">
                                  Customer Reviews
                              </h3>
                              <div className="space-y-4">
                                  {data.reviews.map((review, index) => (
                                      <div
                                          key={index}
                                          className="border-b pb-4"
                                      >
                                          <div className="flex items-center gap-2">
                                              <span className="font-medium">
                                                  {review.name}
                                              </span>
                                              <Ratings rating={review.rating} />
                                          </div>
                                          <p className="mt-2 text-gray-600">
                                              {review.comment}
                                          </p>
                                          <span className="text-sm text-gray-500">
                                              {new Date(
                                                  review.createdAt,
                                              ).toLocaleDateString()}
                                          </span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
  );
};

export default ProductDetailsCard;
