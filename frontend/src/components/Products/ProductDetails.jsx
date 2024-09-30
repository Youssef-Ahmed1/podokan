import React, { useEffect, useState } from "react";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
  AiOutlineLeft,
  AiOutlineRight,
} from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getAllProductsShop } from "../../redux/actions/product";
import { server } from "../../server";
import styles from "../../styles/styles";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import { toast } from "react-toastify";
import Ratings from "./Ratings";
import axios from "axios";

const ProductDetails = ({ data }) => {
  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [selectedColor, setSelectedColor] = useState(data?.ProductColor || "red");
  const [fit, setFit] = useState("Male fit");
  const [size, setSize] = useState("M");
  const [material, setMaterial] = useState("standard");
  const [activeTab, setActiveTab] = useState("product");
  const [productType, setProductType] = useState(data?.ProductType || "t-shirt");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const { products } = useSelector((state) => state.products);

  useEffect(() => {
    if (data) {
      setSelectedColor(data.ProductColor || "red");
      setProductType(data.ProductType || "t-shirt");
    }
  }, [data]);

  useEffect(() => {
    if (data?.shop?._id) {
      dispatch(getAllProductsShop(data.shop._id));
    }
    if (wishlist && data) {
      setClick(wishlist.some((i) => i._id === data._id));
    }
  }, [data, dispatch, wishlist]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prevTab) => (prevTab === "product" ? "design" : "product"));
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const incrementCount = () => {
    setCount((prevCount) => prevCount + 1);
  };

  const decrementCount = () => {
    setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 1));
  };

  const removeFromWishlistHandler = (data) => {
    setClick(false);
    dispatch(removeFromWishlist(data));
  };

  const addToWishlistHandler = (data) => {
    setClick(true);
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
        const cartData = {
          ...data,
          qty: count,
          color: selectedColor,
          fit,
          size,
          material,
          productType,
        };
        dispatch(addTocart(cartData));
        toast.success("Item added to cart successfully!");
      }
    }
  };

  const handleMessageSubmit = async () => {
    if (isAuthenticated) {
      const groupTitle = data._id + user._id;
      const userId = user._id;
      const sellerId = data.shop._id;
      try {
        const res = await axios.post(`${server}/conversation/create-new-conversation`, {
          groupTitle,
          userId,
          sellerId,
        });
        navigate(`/inbox?${res.data.conversation._id}`);
      } catch (error) {
        toast.error(error.response?.data?.message || "An error occurred");
      }
    } else {
      toast.error("Please login to create a conversation");
    }
  };

  const isProductVisible = (product) => {
    if (!product) return false;
    if (product.status === 'public') return true;
    if (product.status === 'restricted' && (user?._id === product.shop._id || user?.role === 'admin')) return true;
    return false;
  };

  const getMockupUrl = () => {
    if (!data) return '';
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    const version = productType === "hoodie" ? "v1724798769" : "v1724807956"
   
    const folder = productType === "hoodie" ? "hoodies" : "shirts";
    const filename = `${productType}-${selectedColor}-front`;
    const extension = productType === "hoodie" ? "jpg" : "webp";
  
    return `${baseUrl}${version}/${folder}/${filename}.${extension}`;
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

  const colorOptions = [
   "red", "blue", "gray", "purple", "yellow", "green","pink"
  ];

  const sizeOptions = ["S", "M", "L", "XL"];

  if (!data) {
    return <div className="w-full min-h-screen flex items-center justify-center">Loading...</div>;
  }
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(0);  // Removing decimal places
  };
  return (
    <div className="bg-white">
      {isProductVisible(data) ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full py-5">
            <div className="block w-full lg:flex lg:space-x-8">
              <div className="w-full lg:w-1/2">
                <div className="relative w-full h-[500px] bg-gray-100 rounded-lg shadow-md z-10">
                  <img
                    src={activeTab === "product" ? getMockupUrl() : getDesignImage()}
                    alt={data.DesignTitle || "Product Image"}
                    className="w-full h-full object-contain"
                  />
                  {activeTab === "product" && (
                    <div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      style={{ 
                        transform: `translate(-50%, -50%) scale(${data.DesignScale || 1})`,
                        width: '200px',
                        height: '200px'
                      }}
                    >
                      <img
                        src={getDesignImage()}
                        alt="Design Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
                    <button
                      className="bg-gray-200 p-2 rounded-full"
                      onClick={() => setActiveTab(activeTab === "product" ? "design" : "product")}
                    >
                      <AiOutlineLeft size={24} />
                    </button>
                  </div>
                  <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
                    <button
                      className="bg-gray-200 p-2 rounded-full"
                      onClick={() => setActiveTab(activeTab === "product" ? "design" : "product")}
                    >
                      <AiOutlineRight size={24} />
                    </button>
                  </div>
                  <div className="absolute top-2 right-2">
                    {click ? (
                      <AiFillHeart
                        size={30}
                        className="cursor-pointer"
                        onClick={() => removeFromWishlistHandler(data)}
                        color="red"
                        title="Remove from wishlist"
                      />
                    ) : (
                      <AiOutlineHeart
                        size={30}
                        className="cursor-pointer"
                        onClick={() => addToWishlistHandler(data)}
                        color="#333"
                        title="Add to wishlist"
                      />
                    )}
                  </div>
                </div>
                <div className="flex justify-center mt-4">
                  <button
                    className={`px-4 py-2 mx-2 rounded-xl ${productType === 't-shirt' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
                    onClick={() => setProductType('t-shirt')}
                  >
                    T-Shirt
                  </button>
                  <button
                    className={`px-4 py-2 mx-2 rounded-xl ${productType === 'hoodie' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
                    onClick={() => setProductType('hoodie')}
                  >
                    Hoodie
                  </button>
                </div>
              </div>
              <div className="w-full lg:w-1/2 pt-5">
                <h1 className="text-2xl text-center mb-4 font-serif">{data.DesignTitle}</h1>
             
                {/* Color selection */}
                <div className="flex items-center mt-4">
                  <h4 className="text-lg font-bold mr-2">Color:</h4>
                  <div className="flex flex-wrap">
                    {colorOptions.map((color) => (
                      <div
                        key={color}
                        className={`border-2 rounded-full w-8 h-8 mx-1 my-1 cursor-pointer ${
                          selectedColor === color ? "border-black" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                {/* Fit selection */}
                <div className="flex items-center mt-4">
                  <h4 className="text-lg font-bold mr-2">Fit:</h4>
                  <div className="flex">
                    <button
                      className={`px-4 py-2 rounded-xl mr-2 ${
                        fit === "Male fit"
                          ? "bg-black text-white"
                          : "bg-gray-200 text-black"
                      }`}
                      onClick={() => setFit("Male fit")}
                    >
                      Male fit
                    </button>
                    <button
                      className={`px-4 py-2 rounded-xl mr-2 ${
                        fit === "Female fit"
                          ? "bg-black text-white"
                          : "bg-gray-200 text-black"
                      }`}
                      onClick={() => setFit("Female fit")}
                    >
                      Female fit
                    </button>
                  </div>
                </div>
                {/* Material selection */}
                <div className="flex items-center mt-4">
                  <h4 className="text-lg font-bold mr-2">Material:</h4>
                  <div className="flex">
                    <button
                      className={`px-4 py-2 rounded-xl mr-2 ${
                        material === "standard"
                          ? "bg-black text-white"
                          : "bg-gray-200 text-black"
                      }`}
                      onClick={() => setMaterial("standard")}
                    >
                      Standard
                    </button>
                    <button
                      className={`px-4 py-2 rounded-xl mr-2 ${
                        material === "premium"
                          ? "bg-black text-white"
                          : "bg-gray-200 text-black"
                      }`}
                      onClick={() => setMaterial("premium")}
                    >
                      Premium
                    </button>
                  </div>
                </div>
                {/* Size selection */}
                <div className="mt-4">
                  <h4 className="text-lg font-bold mb-2">Size:</h4>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((sizeOption) => (
                      <button
                        key={sizeOption}
                        className={`px-4 py-2 rounded-xl ${
                          size === sizeOption
                            ? "bg-black text-white"
                            : "bg-gray-200 text-black"
                        }`}
                        onClick={() => setSize(sizeOption)}
                      >
                        {sizeOption}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Price */}
                <div className="flex items-baseline mt-8">
              <h4 className="text-3xl font-bold text-black">
              £{formatPrice(data.discountPrice || data.originalPrice)}
              </h4>
              {data.discountPrice && data.originalPrice && data.discountPrice < data.originalPrice && (
                <h3 className="text-xl line-through text-gray-400 ml-2">
                  £{formatPrice(data.originalPrice)}
                </h3>
              )}
            </div>
                {/* Add to cart */}
                <div className="flex items-center mt-8">
                  <div className="flex items-center border border-gray-400 rounded-md px-4 py-2">
                    <button
                      className="text-xl font-bold mr-4"
                      onClick={decrementCount}
                    >
                      -
                    </button>
                    <span className="text-lg">{count}</span>
                    <button
                      className="text-xl font-bold ml-4"
                      onClick={incrementCount}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className={`${styles.button} ml-8 text-white`}
                    onClick={() => addToCartHandler(data._id)}
                  >
                    Add to Cart <AiOutlineShoppingCart className="ml-2" />
                  </button>
                </div>
                {/* Message */}
                <div className="flex items-center mt-8">
                  <button
                    className={`${styles.button} w-full text-gray-300`}
                    onClick={handleMessageSubmit}
                  >
                    Send Message <AiOutlineMessage className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <ProductDetailsInfo
            data={data}
            products={products}
            totalReviewsLength={products ? products.reduce((acc, product) => acc + (product.reviews?.length || 0), 0) : 0}
            averageRating={
              products && products.length > 0
                ? (products.reduce((acc, product) => acc + (product.reviews?.reduce((sum, review) => sum + review.rating, 0) || 0), 0) / 
                   products.reduce((acc, product) => acc + (product.reviews?.length || 0), 0)).toFixed(2)
                : 0
            }
          />
        </div>
      ) : (
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">This product is not available.</h2>
        </div>
      )}
    </div>
  );
};

const ProductDetailsInfo = ({
  data,
  products,
  totalReviewsLength,
  averageRating,
}) => {
  const [active, setActive] = useState(1);

  return (
    <div className="bg-[#f5f6fb] px-3 800px:px-10 py-2 rounded">
      <div className="w-full flex justify-between border-b pt-10 pb-2">
        <div className="relative">
          <h5
            className={
              "text-[#000] text-[18px] px-1 leading-5 font-[600] cursor-pointer 800px:text-[20px]"
            }
            onClick={() => setActive(1)}
          >
            Product Details
          </h5>
          {active === 1 ? (
            <div className={`${styles.active_indicator}`} />
          ) : null}
        </div>
        <div className="relative">
          <h5
            className={
              "text-[#000] text-[18px] px-1 leading-5 font-[600] cursor-pointer 800px:text-[20px]"
            }
            onClick={() => setActive(2)}
          >
            Product Reviews
          </h5>
          {active === 2 ? (
            <div className={`${styles.active_indicator}`} />
          ) : null}
        </div>
        <div className="relative">
          <h5
            className={
              "text-[#000] text-[18px] px-1 leading-5 font-[600] cursor-pointer 800px:text-[20px]"
            }
            onClick={() => setActive(3)}
          >
            Seller Information
          </h5>
          {active === 3 ? (
            <div className={`${styles.active_indicator}`} />
          ) : null}
        </div>
      </div>
      {active === 1 ? (
        <>
          <p className="py-2 text-[18px] leading-8 pb-10 whitespace-pre-line">
            {data.Description}
          </p>
        </>
      ) : null}

      {active === 2 ? (
        <div className="w-full min-h-[40vh] flex flex-col items-center py-3 overflow-y-scroll">
          {data &&
            data.reviews.map((item, index) => (
              <div key={index} className="w-full flex my-2">
                <img
                  src={`${item.user.avatar?.url}`}
                  alt=""
                  className="w-[50px] h-[50px] rounded-full"
                />
                <div className="pl-2">
                  <div className="w-full flex items-center">
                    <h1 className="font-[500] mr-3">{item.user.name}</h1>
                    <Ratings rating={item.rating} />
                  </div>
                  <p>{item.comment}</p>
                </div>
              </div>
            ))}

          <div className="w-full flex justify-center">
            {data && data.reviews.length === 0 && (
              <h5>No Reviews have been submitted for this product!</h5>
            )}
          </div>
        </div>
      ) : null}

      {active === 3 && (
        <div className="w-full block 800px:flex p-5">
          <div className="w-full 800px:w-[50%]">
            <Link to={`/shop/preview/${data.shop._id}`}>
              <div className="flex items-center">
                <img
                  src={`${data?.shop?.avatar?.url}`}
                  className="w-[50px] h-[50px] rounded-full"
                  alt=""
                />
                <div className="pl-3">
                  <h3 className={`${styles.shop_name}`}>{data.shop.name}</h3>
                  <h5 className="pb-2 text-[15px]">
                    ({averageRating}/5) Ratings
                  </h5>
                </div>
              </div>
            </Link>
            <p className="pt-2">{data.shop.Description}</p>
          </div>
          <div className="w-full 800px:w-[50%] mt-5 800px:mt-0 800px:flex flex-col items-end">
            <div className="text-left">
              <h5 className="font-[600]">
                Joined on:{" "}
                <span className="font-[500]">
                  {data.shop?.createdAt?.slice(0, 10)}
                </span>
              </h5>
              <h5 className="font-[600] pt-3">
                Total Products:{" "}
                <span className="font-[500]">
                  {products && products.length}
                </span>
              </h5>
              <h5 className="font-[600] pt-3">
                Total Reviews:{" "}
                <span className="font-[500]">{totalReviewsLength}</span>
              </h5>
              <Link to="/">
                <div
                  className={`${styles.button} !rounded-[4px] !h-[39.5px] mt-3`}
                >
                  <h4 className="text-white">Visit Shop</h4>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;