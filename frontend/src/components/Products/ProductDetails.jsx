import React, { useEffect, useState, memo } from "react";
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

// Memoized ProductDetailsInfo component for better performance
const ProductDetailsInfo = memo(({
  data,
  products,
  totalReviewsLength,
  averageRating,
}) => {
  const [active, setActive] = useState(1);

  const tabs = [
    { id: 1, label: "Product Details" },
    { id: 2, label: "Product Reviews" },
    { id: 3, label: "Seller Information" },
  ];

  return (
    <div className="bg-[#f5f6fb] rounded-lg overflow-hidden shadow-sm">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex justify-between px-4 sm:px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className="relative py-4 px-1 focus:outline-none"
              onClick={() => setActive(tab.id)}
            >
              <h5
                className={`
                  text-[16px] xs:text-[18px] font-semibold
                  transition-colors duration-200
                  ${active === tab.id ? 'text-black' : 'text-gray-600 hover:text-gray-800'}
                `}
              >
                {tab.label}
              </h5>
              {active === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-4 sm:p-8">
        {/* Product Details Tab */}
        {active === 1 && (
          <div className="prose max-w-none">
            <p className="text-[16px] xs:text-[18px] leading-7 whitespace-pre-line text-gray-600">
              {data.Description}
            </p>
          </div>
        )}

        {/* Reviews Tab */}
        {active === 2 && (
          <div className="min-h-[40vh] space-y-4">
            {data.reviews?.length > 0 ? (
              data.reviews.map((item, index) => (
                <div key={index} className="flex space-x-4 bg-white p-4 rounded-lg shadow-sm">
                  <img
                    src={item.user.avatar?.url}
                    alt={item.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="font-semibold">{item.user.name}</h1>
                      <Ratings rating={item.rating} />
                    </div>
                    <p className="mt-2 text-gray-600">{item.comment}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center h-[40vh]">
                <h5 className="text-center text-gray-500">
                  No Reviews have been submitted for this product!
                </h5>
              </div>
            )}
          </div>
        )}

        {/* Seller Information Tab */}
        {active === 3 && (
          <div className="grid grid-cols-1 800px:grid-cols-2 gap-6 p-5">
            <div>
              <Link to={`/shop/preview/${data.shop._id}`}>
                <div className="flex items-center gap-4">
                  <img
                    src={data?.shop?.avatar?.url}
                    className="w-[50px] h-[50px] rounded-full object-cover"
                    alt={data.shop.name}
                  />
                  <div>
                    <h3 className="text-[20px] font-semibold">
                      {data.shop.name}
                    </h3>
                    <h5 className="text-[16px] text-gray-600">
                      ({averageRating}/5) Ratings
                    </h5>
                  </div>
                </div>
              </Link>
              <p className="pt-2 text-gray-500 leading-7">{data.shop.Description}</p>
            </div>

            <div className="flex flex-col items-end">
              <div className="text-left w-full 800px:w-[80%] space-y-4">
                <div className="space-y-1">
                  <h5 className="font-semibold">Joined On:</h5>
                  <span className="text-gray-500">
                    {new Date(data.shop?.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <h5 className="font-semibold">Total Products:</h5>
                  <span className="text-gray-500">
                    {products?.length || 0}
                  </span>
                </div>

                <div className="space-y-1">
                  <h5 className="font-semibold">Total Reviews:</h5>
                  <span className="text-gray-500">{totalReviewsLength}</span>
                </div>

                <Link 
                  to={`/shop/preview/${data.shop._id}`}
                  className="inline-block w-full"
                >
                  <button className={`${styles.button} w-full !rounded-md !h-[40px]`}>
                    <span className="text-white">Visit Shop</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});const ProductDetails = memo(({ data }) => {
  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [selectedColor, setSelectedColor] = useState(data?.ProductColor || "white");
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

  // Constants
  const colorOptions = ["white", "black", "red", "blue", "gray"];
  const sizeOptions = ["S", "M", "L", "XL"];
  const productTypes = [
    { id: 't-shirt', label: 'T-Shirt' },
    { id: 'hoodie', label: 'Hoodie' },
    { id: 'long-sleeve', label: 'Long Sleeve' }
  ];

  // Effects
  useEffect(() => {
    if (data) {
      setSelectedColor(data.ProductColor || "white");
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

  // Memoized handlers
  const handleQuantityChange = React.useCallback((type) => {
    setCount(prev => type === 'increment' ? prev + 1 : prev > 1 ? prev - 1 : 1);
  }, []);

  const handleWishlistToggle = React.useCallback((data) => {
    const newState = !click;
    setClick(newState);
    dispatch(newState ? addToWishlist(data) : removeFromWishlist(data));
  }, [click, dispatch]);

  const handleAddToCart = React.useCallback((id) => {
    if (cart?.find((i) => i._id === id)) {
      toast.error("Item already in cart!");
      return;
    }

    if (data.stock < 1) {
      toast.error("Product stock limited!");
      return;
    }

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
  }, [cart, count, selectedColor, fit, size, material, productType, dispatch, data]);

  const handleMessageSubmit = React.useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please login to create a conversation");
      return;
    }

    try {
      const res = await axios.post(`${server}/conversation/create-new-conversation`, {
        groupTitle: data._id + user._id,
        userId: user._id,
        sellerId: data.shop._id,
      });
      navigate(`/inbox?${res.data.conversation._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  }, [isAuthenticated, user, data, navigate]);

  const getMockupUrl = React.useCallback(() => {
    if (!data) return '';
    
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    const config = {
      hoodie: {
        version: "v1728392918",
        folder: "hoodies",
        filename: `hoodie-${selectedColor}-front`
      },
      "t-shirt": {
        version: "v1728393898",
        folder: "t-shirts",
        filename: `t-shirt-${selectedColor}-front`
      },
      "long-sleeve": {
        version: "v1728394665",
        folder: "long-sleeves",
        filename: selectedColor === "gray" 
          ? `longsleeves-${selectedColor}-front`
          : ["white", "black"].includes(selectedColor)
            ? `longseleves-${selectedColor}-front`
            : `t-shirt-${selectedColor}-front`
      }
    };

    const productConfig = config[productType];
    if (!productConfig) return "";

    const { version, folder, filename } = productConfig;
    return `${baseUrl}${version}/${folder}/${filename}.png`;
  }, [productType, selectedColor, data]);

  const getDesignImage = React.useCallback(() => {
    if (!data?.designImage) return '';
    return typeof data.designImage === 'string' 
      ? data.designImage 
      : data.designImage.url || '';
  }, [data]);

  const isProductVisible = React.useCallback((product) => {
    if (!product) return false;
    if (product.status === 'public') return true;
    return product.status === 'restricted' && 
      (user?._id === product.shop._id || user?.role === 'admin');
  }, [user]);

  const formatPrice = (price) => parseFloat(price).toFixed(0);

  if (!data) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl text-gray-600">Loading...</div>
      </div>
    );
  }return (
    <div className="bg-white min-h-screen">
      {isProductVisible(data) ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5 sm:py-8">
            <div className="flex flex-col lg:flex-row lg:space-x-8">
              {/* Product Image Section */}
              <section className="w-full lg:w-1/2 mb-8 lg:mb-0">
                <div className="relative w-full h-[300px] xs:h-[400px] sm:h-[500px] bg-gray-100 rounded-lg shadow-md overflow-hidden">
                  <img
                    src={activeTab === "product" ? getMockupUrl() : getDesignImage()}
                    alt={`${data.DesignTitle} - ${activeTab === "product" ? "Product View" : "Design View"}`}
                    className="w-full h-full object-contain transition-opacity duration-300"
                  />
                  
                  {/* Design Overlay */}
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
                        alt="Design Overlay"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Navigation Controls */}
                  <div className="absolute inset-y-0 left-2 flex items-center">
                    <button
                      type="button"
                      aria-label="Previous view"
                      className="bg-white/90 hover:bg-white p-2 rounded-full transition-all duration-200 
                               shadow-md hover:shadow-lg transform hover:scale-105"
                      onClick={() => setActiveTab(activeTab === "product" ? "design" : "product")}
                    >
                      <AiOutlineLeft size={24} />
                    </button>
                  </div>

                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <button
                      type="button"
                      aria-label="Next view"
                      className="bg-white/90 hover:bg-white p-2 rounded-full transition-all duration-200 
                               shadow-md hover:shadow-lg transform hover:scale-105"
                      onClick={() => setActiveTab(activeTab === "product" ? "design" : "product")}
                    >
                      <AiOutlineRight size={24} />
                    </button>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    aria-label={click ? "Remove from wishlist" : "Add to wishlist"}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white 
                             transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    onClick={() => handleWishlistToggle(data)}
                  >
                    {click ? (
                      <AiFillHeart size={30} className="text-red-500" />
                    ) : (
                      <AiOutlineHeart size={30} className="text-gray-700" />
                    )}
                  </button>
                </div>
                
                {/* Product Type Selection */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {productTypes.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      className={`
                        px-4 py-2 rounded-xl transition-all duration-200
                        ${productType === id 
                          ? 'bg-black text-white shadow-lg transform scale-105' 
                          : 'bg-gray-200 hover:bg-gray-300 text-black'}
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                      `}
                      onClick={() => setProductType(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Product Details Section */}
              <section className="w-full lg:w-1/2">
                <div className="space-y-6">
                  <h1 className="text-2xl sm:text-3xl font-bold font-Poppins text-center lg:text-left">
                    {data.DesignTitle}
                  </h1>
                  
                  {/* Price Display */}
                  <div className="flex items-baseline justify-center lg:justify-start space-x-2">
                    <h4 className="text-3xl font-bold text-black">
                      £{formatPrice(data.discountPrice || data.originalPrice)}
                    </h4>
                    {data.discountPrice && data.originalPrice && data.discountPrice < data.originalPrice && (
                      <h3 className="text-xl line-through text-gray-400">
                        £{formatPrice(data.originalPrice)}
                      </h3>
                    )}
                  </div>

                  {/* Color Selection */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold">Color:</h4>
                    <div className="flex flex-wrap gap-3">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Select ${color} color`}
                          className={`
                            w-10 h-10 rounded-full cursor-pointer
                            transition-all duration-200 hover:scale-110
                            ${selectedColor === color 
                              ? "ring-2 ring-offset-2 ring-black" 
                              : "ring-1 ring-gray-300"}
                          `}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Fit Selection */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold">Fit:</h4>
                    <div className="flex flex-wrap gap-3">
                      {["Male fit", "Female fit"].map((fitOption) => (
                        <button
                          key={fitOption}
                          type="button"
                          className={`
                            px-4 py-2 rounded-xl transition-all duration-200
                            ${fit === fitOption 
                              ? "bg-black text-white shadow-lg transform scale-105" 
                              : "bg-gray-200 hover:bg-gray-300 text-black"}
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                          `}
                          onClick={() => setFit(fitOption)}
                        >
                          {fitOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Material Selection */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold">Material:</h4>
                    <div className="flex flex-wrap gap-3">
                      {["standard", "premium"].map((materialOption) => (
                        <button
                          key={materialOption}
                          type="button"
                          className={`
                            px-4 py-2 rounded-xl transition-all duration-200
                            ${material === materialOption 
                              ? "bg-black text-white shadow-lg transform scale-105" 
                              : "bg-gray-200 hover:bg-gray-300 text-black"}
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                          `}
                          onClick={() => setMaterial(materialOption)}
                        >
                          {materialOption.charAt(0).toUpperCase() + materialOption.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold">Size:</h4>
                    <div className="flex flex-wrap gap-3">
                      {sizeOptions.map((sizeOption) => (
                        <button
                          key={sizeOption}
                          type="button"
                          className={`
                            px-4 py-2 rounded-xl transition-all duration-200
                            ${size === sizeOption 
                              ? "bg-black text-white shadow-lg transform scale-105" 
                              : "bg-gray-200 hover:bg-gray-300 text-black"}
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                          `}
                          onClick={() => setSize(sizeOption)}
                        >
                          {sizeOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity and Add to Cart */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                      <button
                        type="button"
                        className="px-4 py-2 text-xl font-bold hover:bg-gray-100 transition-colors"
                        onClick={() => handleQuantityChange('decrement')}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-4 text-lg min-w-[3rem] text-center">{count}</span>
                      <button
                        type="button"
                        className="px-4 py-2 text-xl font-bold hover:bg-gray-100 transition-colors"
                        onClick={() => handleQuantityChange('increment')}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      className={`
                        ${styles.button} flex-1 text-white hover:opacity-90 
                        transition-all duration-200 transform hover:scale-105
                        flex items-center justify-center gap-2
                      `}
                      onClick={() => handleAddToCart(data._id)}
                    >
                      <span>Add to Cart</span>
                      <AiOutlineShoppingCart size={20} />
                    </button>
                  </div>

                  {/* Message Button */}
                  <button
                    type="button"
                    className={`
                      ${styles.button} w-full text-white hover:opacity-90 
                      transition-all duration-200 transform hover:scale-105
                      flex items-center justify-center gap-2
                    `}
                    onClick={handleMessageSubmit}
                  >
                    <span>Send Message</span>
                    <AiOutlineMessage size={20} />
                  </button>
                </div>
              </section>
            </div>

            {/* Product Details Info Section */}
            <div className="mt-12">
              <ProductDetailsInfo
                data={data}
                products={products}
                totalReviewsLength={products?.reduce((acc, product) => acc + (product.reviews?.length || 0), 0) || 0}
                averageRating={
                  products?.length > 0
                    ? (products.reduce((acc, product) => 
                        acc + (product.reviews?.reduce((sum, review) => sum + review.rating, 0) || 0), 0) / 
                      products.reduce((acc, product) => acc + (product.reviews?.length || 0), 0)).toFixed(2)
                    : 0
                }
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold text-gray-800">
            This product is not available.
          </h2>
        </div>
      )}
    </div>
  );
});

export default ProductDetails;