import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  AiOutlineShoppingCart,
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineMinus,
  AiOutlinePlus,
  AiOutlineEye,
} from "react-icons/ai";
import { addTocart } from "../../redux/actions/cart";
import { addToWishlist, removeFromWishlist } from "../../redux/actions/wishlist";
import styles from "../../styles/styles";
import axios from "axios";
import { server } from "../../server";

const ProductDetails = ({ data }) => {
  const { cart } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [select, setSelect] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState(0);
  const mountedRef = useRef(true);

  // Calculate available stock
  useEffect(() => {
    if (data) {
      // Get total stock from data
      const totalStock = data.stock || 0;
      
      // Calculate stock already in cart
      const cartItem = cart.find(
        (item) => 
          item._id === data._id && 
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
      );
      
      const cartQuantity = cartItem ? cartItem.qty : 0;
      
      // Set available stock
      setStock(Math.max(0, totalStock - cartQuantity));
    }
  }, [data, cart, selectedColor, selectedSize]);

  // Handle view count
  useEffect(() => {
    const updateViews = async () => {
      try {
        if (data?._id) {
          const response = await axios.get(
            `${server}/product/get-product-views/${data._id}`
          );
          if (mountedRef.current) {
            setViewCount(response.data.viewCount || 0);
          }
          
          // Increment view count
          await axios.post(`${server}/product/increment-view/${data._id}`);
        }
      } catch (error) {
        console.error("Error updating view count:", error);
      }
    };

    updateViews();

    return () => {
      mountedRef.current = false;
    };
  }, [data?._id]);

  useEffect(() => {
    if (wishlist && data) {
      setClick(wishlist.find((i) => i._id === data._id) ? true : false);
    }
  }, [wishlist, data]);

  const handleMessageSubmit = () => {
    if (isAuthenticated) {
      // Handle message submission
    } else {
      toast.error("Please login to contact seller");
    }
  };

  const incrementCount = () => {
    if (count < stock) {
      setCount(count + 1);
    } else {
      toast.warning("Maximum available quantity reached");
    }
  };

  const decrementCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  const addToCartHandler = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }

    if (stock <= 0) {
      toast.error("This item is out of stock");
      return;
    }

    setLoading(true);
    try {
      const cartData = {
        ...data,
        qty: count,
        selectedColor,
        selectedSize,
        stock: stock,
      };
      
      await dispatch(addTocart(cartData));
      toast.success("Item added to cart successfully!");
    } catch (error) {
      toast.error("Failed to add item to cart");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlistHandler = (data) => {
    setClick(!click);
    dispatch(removeFromWishlist(data));
  };

  const addToWishlistHandler = (data) => {
    setClick(!click);
    dispatch(addToWishlist(data));
  };

  const availableColors = data?.availableColors || ["white", "black"];
  const availableSizes = ["S", "M", "L", "XL", "2XL"];

  return (
    <div className="bg-white">
      {data ? (
        <div className={`${styles.section} w-[90%] 800px:w-[80%]`}>
          <div className="w-full py-5">
            <div className="block w-full 800px:flex">
              {/* Product Images */}
              <div className="w-full 800px:w-[50%]">
                <img
                  src={data.designImage?.url}
                  alt="Product Preview"
                  className="w-full h-auto"
                />
              </div>

              {/* Product Details */}
              <div className="w-full 800px:w-[50%] pt-5 pl-[5px] pr-[5px]">
                <h1 className={`${styles.productTitle} text-[20px]`}>
                  {data.name || data.DesignTitle}
                </h1>
                
                {/* View Count */}
                <div className="flex items-center mt-2 text-gray-500">
                  <AiOutlineEye className="mr-2" />
                  <span>{viewCount} people viewed this product</span>
                </div>

                {/* Price */}
                <div className="flex pt-3">
                  <h4 className={`${styles.productDiscountPrice}`}>
                    ${data.discountPrice}
                  </h4>
                  <h3 className={`${styles.price}`}>
                    {data.originalPrice ? "$" + data.originalPrice : null}
                  </h3>
                </div>

                {/* Stock Status */}
                <div className="mt-4">
                  <span className={`text-sm font-medium ${
                    stock > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock > 0 ? (
                      <>In Stock ({stock} available)</>
                    ) : (
                      "Out of Stock"
                    )}
                  </span>
                </div>

                {/* Color Selection */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium">Color</h4>
                  <div className="flex gap-2 mt-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedColor === color
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium">Size</h4>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 text-center rounded-md ${
                          selectedSize === size
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium">Quantity</h4>
                  <div className="flex items-center mt-2">
                    <button
                      className="p-2 border rounded-l-md"
                      onClick={decrementCount}
                      disabled={count <= 1}
                    >
                      <AiOutlineMinus />
                    </button>
                    <span className="px-4 py-2 border-t border-b">
                      {count}
                    </span>
                    <button
                      className="p-2 border rounded-r-md"
                      onClick={incrementCount}
                      disabled={count >= stock}
                    >
                      <AiOutlinePlus />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                  <button
                    className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center gap-2 ${
                      stock > 0
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    } text-white transition-colors duration-200`}
                    onClick={addToCartHandler}
                    disabled={loading || stock <= 0}
                  >
                    <AiOutlineShoppingCart size={20} />
                    {loading ? "Adding..." : stock <= 0 ? "Out of Stock" : "Add to Cart"}
                  </button>

                  <button
                    className="p-3 rounded-md border hover:bg-gray-50"
                    onClick={() =>
                      click ? removeFromWishlistHandler(data) : addToWishlistHandler(data)
                    }
                  >
                    {click ? (
                      <AiFillHeart size={22} className="text-red-500" />
                    ) : (
                      <AiOutlineHeart size={22} />
                    )}
                  </button>
                </div>

                {/* Product Description */}
                <div className="mt-8">
                  <h4 className="text-lg font-medium">Description</h4>
                  <p className="mt-2 text-gray-600">
                    {data.Description || "No description available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductDetails;