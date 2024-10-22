import React, { useEffect, useState, useCallback, memo } from "react";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineZoomIn,
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

// Product size guide component
const SizeGuide = memo(({ onClose }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Size Guide</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Size</th>
                <th className="p-2">Chest (inches)</th>
                <th className="p-2">Length (inches)</th>
                <th className="p-2">Sleeve (inches)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { size: 'S', chest: '36-38', length: '27', sleeve: '8.5' },
                { size: 'M', chest: '39-41', length: '28', sleeve: '9' },
                { size: 'L', chest: '42-44', length: '29', sleeve: '9.5' },
                { size: 'XL', chest: '45-47', length: '30', sleeve: '10' },
              ].map((row) => (
                <tr key={row.size} className="border-b">
                  <td className="p-2 font-medium">{row.size}</td>
                  <td className="p-2 text-center">{row.chest}</td>
                  <td className="p-2 text-center">{row.length}</td>
                  <td className="p-2 text-center">{row.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
));

// Image zoom modal component
const ZoomModal = memo(({ image, onClose }) => (
  <div 
    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div 
      className="relative max-w-4xl w-full h-full flex items-center justify-center"
      onClick={e => e.stopPropagation()}
    >
      <img
        src={image}
        alt="Zoomed product view"
        className="max-w-full max-h-full object-contain"
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <span className="text-3xl">×</span>
      </button>
    </div>
  </div>
));

const ProductDetails = memo(({ data }) => {
  // States
  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [selectedColor, setSelectedColor] = useState(data?.ProductColor || "white");
  const [fit, setFit] = useState("Male fit");
  const [size, setSize] = useState("M");
  const [material, setMaterial] = useState("standard");
  const [activeTab, setActiveTab] = useState("product");
  const [productType, setProductType] = useState(data?.ProductType || "t-shirt");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [designScale, setDesignScale] = useState(data?.DesignScale || 1);

  // Hooks
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
    { id: 't-shirt', label: 'T-Shirt', basePrice: 20 },
    { id: 'hoodie', label: 'Hoodie', basePrice: 40 },
    { id: 'long-sleeve', label: 'Long Sleeve', basePrice: 30 }
  ];
  const materialOptions = [
    { id: 'standard', label: 'Standard', priceMultiplier: 1 },
    { id: 'premium', label: 'Premium', priceMultiplier: 1.5 }
  ];

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive design scale
  const getResponsiveScale = useCallback(() => {
    const baseScale = data?.DesignScale || 1;
    if (windowWidth < 640) return baseScale * 0.7;  // Mobile
    if (windowWidth < 1024) return baseScale * 0.85; // Tablet
    return baseScale; // Desktop
  }, [windowWidth, data?.DesignScale]);

  useEffect(() => {
    setDesignScale(getResponsiveScale());
  }, [windowWidth, getResponsiveScale]);

  // Product data effects
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

  // Price calculation
  const calculatePrice = useCallback((basePrice) => {
    const materialMultiplier = materialOptions.find(m => m.id === material)?.priceMultiplier || 1;
    return basePrice * materialMultiplier;
  }, [material]);

  // Handlers
  const handleQuantityChange = useCallback((type) => {
    setCount(prev => type === 'increment' ? prev + 1 : prev > 1 ? prev - 1 : 1);
  }, []);

  const handleWishlistToggle = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist");
      return;
    }
    
    const newState = !click;
    setClick(newState);
    dispatch(newState ? addToWishlist(data) : removeFromWishlist(data));
    toast.success(newState ? "Added to wishlist" : "Removed from wishlist");
  }, [click, dispatch, data, isAuthenticated]);// Cart handler
  const handleAddToCart = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (cart?.find((i) => i._id === data._id)) {
      toast.error("Item already in cart!");
      return;
    }

    if (data.stock < 1) {
      toast.error("Product stock limited!");
      return;
    }

    const selectedProduct = productTypes.find(p => p.id === productType);
    const price = calculatePrice(selectedProduct?.basePrice || 20);

    const cartData = {
      ...data,
      qty: count,
      color: selectedColor,
      fit,
      size,
      material,
      productType,
      price,
    };
    
    dispatch(addTocart(cartData));
    toast.success("Added to cart successfully!");
  }, [cart, count, selectedColor, fit, size, material, productType, dispatch, data, isAuthenticated, calculatePrice]);

  // Message handler
  const handleMessageSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please login to send messages");
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
      toast.error(error.response?.data?.message || "Failed to create conversation");
    }
  }, [isAuthenticated, user, data, navigate]);

  // Image URL handlers
  const getMockupUrl = useCallback(() => {
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

    return `${baseUrl}${productConfig.version}/${productConfig.folder}/${productConfig.filename}.png`;
  }, [productType, selectedColor, data]);

  const getDesignImage = useCallback(() => {
    if (!data?.designImage) return '';
    return typeof data.designImage === 'string' 
      ? data.designImage 
      : data.designImage.url || '';
  }, [data]);

  // Visibility checker
  const isProductVisible = useCallback((product) => {
    if (!product) return false;
    if (product.status === 'public') return true;
    return product.status === 'restricted' && 
      (user?._id === product.shop._id || user?.role === 'admin');
  }, [user]);

  const formatPrice = (price) => parseFloat(price).toFixed(2);

  if (!data) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {isProductVisible(data) ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:space-x-8">
            {/* Product Image Section */}
            <section className="w-full lg:w-1/2 mb-8 lg:mb-0">
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg shadow-md overflow-hidden">
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
                      transform: `translate(-50%, -50%) scale(${designScale})`,
                      width: windowWidth < 640 ? '150px' : '200px',
                      height: windowWidth < 640 ? '150px' : '200px'
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

                {/* Zoom Button */}
                <button
                  type="button"
                  aria-label="Zoom image"
                  className="absolute top-2 left-2 bg-white/90 hover:bg-white p-2 rounded-full
                           transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  onClick={() => setShowZoom(true)}
                >
                  <AiOutlineZoomIn size={24} />
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  aria-label={click ? "Remove from wishlist" : "Add to wishlist"}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-full
                           transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  onClick={handleWishlistToggle}
                >
                  {click ? (
                    <AiFillHeart size={24} className="text-red-500" />
                  ) : (
                    <AiOutlineHeart size={24} className="text-gray-700" />
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
                <h1 className="text-2xl sm:text-3xl font-bold font-Poppins">
                  {data.DesignTitle}
                </h1>
                
                {/* Price Display */}
                <div className="flex items-baseline space-x-2">
                  <h4 className="text-3xl font-bold text-black">
                    £{formatPrice(calculatePrice(productTypes.find(p => p.id === productType)?.basePrice || 20))}
                  </h4>
                  {material === 'premium' && (
                    <span className="text-sm text-gray-500">Premium material</span>
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

                {/* Size Selection with Guide */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold">Size:</h4>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setShowSizeGuide(true)}
                    >
                      Size Guide
                    </button>
                  </div>
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

                {/* Material Selection */}
                <div className="space-y-3">
                  <h4 className="text-lg font-bold">Material:</h4>
                  <div className="flex flex-wrap gap-3">
                    {materialOptions.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`
                          px-4 py-2 rounded-xl transition-all duration-200
                          ${material === id 
                            ? "bg-black text-white shadow-lg transform scale-105" 
                            : "bg-gray-200 hover:bg-gray-300 text-black"}
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                        `}
                        onClick={() => setMaterial(id)}
                      >
                        {label}
                      </button>
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
                    onClick={handleAddToCart}
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
                  <span>Contact Designer</span>
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
              totalReviewsLength={products?.reduce((acc, product) => 
                acc + (product.reviews?.length || 0), 0) || 0}
              averageRating={
                products?.length > 0
                  ? (products.reduce((acc, product) => 
                      acc + (product.reviews?.reduce((sum, review) => 
                        sum + review.rating, 0) || 0), 0) / 
                    products.reduce((acc, product) => 
                      acc + (product.reviews?.length || 0), 0)).toFixed(2)
                  : 0
              }
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold text-gray-800">
            This product is not available.
          </h2>
        </div>
      )}

      {/* Modals */}
      {showSizeGuide && (
        <SizeGuide onClose={() => setShowSizeGuide(false)} />
      )}

      {showZoom && (
        <ZoomModal 
          image={activeTab === "product" ? getMockupUrl() : getDesignImage()}
          onClose={() => setShowZoom(false)}
        />
      )}
    </div>
  );
});

export default ProductDetails;