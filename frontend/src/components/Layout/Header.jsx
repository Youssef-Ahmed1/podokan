import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../../styles/styles";
import {
  AiOutlineHeart,
  AiOutlineSearch,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { FiArrowRight, FiUpload } from "react-icons/fi";
import { GiHamburgerMenu } from 'react-icons/gi';
import Navbar from "./Navbar";
import { useSelector } from "react-redux";
import Cart from "../cart/Cart";
import Wishlist from "../Wishlist/Wishlist";
import { RxCross1 } from "react-icons/rx";
import siteLogo from "../../Assests/siteLogo.png";

const Header = ({ activeHeading }) => {
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const { isSeller } = useSelector((state) => state.seller);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { allProducts } = useSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchData, setSearchData] = useState(null);
  const [active, setActive] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [openWishlist, setOpenWishlist] = useState(false);
  const [open, setOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const location = useLocation();

  const placeholders = [
    "Search for t-shirts...",
    "Find your style...",
    "Discover unique designs...",
    "Explore our collection...",
    "searching for a trend maybe? "
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPlaceholderIndex((prevIndex) => 
        (prevIndex + 1) % placeholders.length
      );
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length === 0) {
      setSearchData(null);
    } else {
      const filteredProducts =
        allProducts &&
        allProducts.filter((product) =>
          product.DesignTitle && product.DesignTitle.toLowerCase().includes(term.toLowerCase())
        );
      setSearchData(filteredProducts);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 70) {
        setActive(true);
      } else {
        setActive(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Desktop Header */}
      <div 
        className={`
          ${active === true ? "shadow-sm absolute top-0 left-0 z-50" : "relative z-50"} 
          w-full bg-[#151523] transition-all duration-300
          hidden lg:block
        `}
      >
        <div className="max-w-[1600px] mx-auto px-4 xl:px-8">
          <div className="flex items-center justify-between h-[120px]">
            {/* Left Section - Menu & Logo */}
            <div className="flex items-center space-x-8">
              <GiHamburgerMenu 
                size={40} 
                className="cursor-pointer text-[#4e64df] hover:text-[#5d71e7] transition-colors"
                onClick={() => setOpen(true)}
              />
              <Link to="/" className="flex-shrink-0">
                <img 
                  src={siteLogo} 
                  alt="Site Logo" 
                  className="h-[180px] w-[150px] object-contain"
                />
              </Link>
            </div>

            {/* Center Section - Search */}
            <div className="flex-1 max-w-2xl mx-12">
              <div className="relative">
                <div className="w-full relative animate-border inline-block bg-gradient-to-r from-[#551c2c] via-[#b131ea] to-[#f2ad55] bg-[length:400%_400%] p-[2px] rounded-md">
                  <input
                    type="text"
                    placeholder={placeholders[placeholderIndex]}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full h-[50px] px-4 rounded-md bg-[#151523] text-white focus:outline-none"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <AiOutlineSearch 
                      size={24} 
                      className="text-white cursor-pointer"
                    />
                  </div>
                </div>
                
                {/* Search Results Dropdown */}
                {searchData && searchData.length !== 0 && (
                  <div className="absolute w-full mt-2 bg-white rounded-md shadow-lg z-50 max-h-[60vh] overflow-y-auto">
                    {searchData.map((item, index) => (
                      <Link 
                        key={index} 
                        to={`/product/${item._id}`}
                        className="flex items-center p-3 hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src={item.designImage?.url}
                          alt=""
                          className="w-12 h-12 object-cover rounded-md mr-3"
                        />
                        <span className="text-gray-800">{item.DesignTitle}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-6">
              <div className="relative cursor-pointer" onClick={() => setOpenWishlist(true)}>
                <AiOutlineHeart 
                  size={30} 
                  className="text-white/80 hover:text-white transition-colors"
                />
                {wishlist?.length > 0 && (
                  <span className="absolute -right-2 -top-2 bg-[#f6b92e] w-5 h-5 rounded-full flex items-center justify-center text-white text-xs">
                    {wishlist.length}
                  </span>
                )}
              </div>

              <div className="relative cursor-pointer" onClick={() => setOpenCart(true)}>
                <AiOutlineShoppingCart 
                  size={30} 
                  className="text-white/80 hover:text-white transition-colors"
                />
                {cart?.length > 0 && (
                  <span className="absolute -right-2 -top-2 bg-[#f6b92e] w-5 h-5 rounded-full flex items-center justify-center text-white text-xs">
                    {cart.length}
                  </span>
                )}
              </div>

              {isAuthenticated ? (
                <Link to="/profile">
                  <img
                    src={user?.avatar?.url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-white/20"
                  />
                </Link>
              ) : (
                <Link 
                  to="/login"
                  className="text-white hover:text-white/80 transition-colors"
                >
                  Login
                </Link>
              )}

              <Link 
                to="/dashboard-create-product"
                className="bg-[#4e64df] hover:bg-[#5d71e7] text-white px-6 py-2 rounded-full flex items-center space-x-2 transition-colors"
              >
                <FiUpload />
                <span>Upload Your Art</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

       {/* Mobile Header */}
     {/* Mobile Header */}
<div className={`
  ${active ? "shadow-sm fixed top-0 left-0 z-50" : "relative z-50"}
   w-full bg-[#151523] lg:hidden
`}>
  {/* Top Bar */}
  <div className="px-4 py-2 flex items-center justify-between h-[70px] border-b border-white/10">
    {/* Left - Menu Button */}
    <button
      onClick={() => setOpen(true)}
      className="p-2 -ml-2"
    >
      <GiHamburgerMenu size={24} className="text-white" />
    </button>

    {/* Center - Logo */}
    <Link to="/" className="flex-shrink-0">
      <img
        src={siteLogo}
        alt="Site Logo"
        className="h-[45px] object-contain"
      />
    </Link>

    {/* Right - Icons */}
    <div className="flex items-center space-x-4">
      {isAuthenticated ? (
        <Link to="/profile">
          <img
            src={user?.avatar?.url}
            alt="Profile"
            className="w-8 h-8 rounded-full border border-white/20"
          />
        </Link>
      ) : (
        <Link to="/login">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white text-sm">?</span>
          </div>
        </Link>
      )}
      
      <div className="relative" onClick={() => setOpenCart(true)}>
        <AiOutlineShoppingCart size={24} className="text-white" />
        {cart?.length > 0 && (
          <span className="absolute -right-2 -top-2 bg-[#f6b92e] w-5 h-5 rounded-full flex items-center justify-center text-white text-xs">
            {cart.length}
          </span>
        )}
      </div>
    </div>
  </div>

  {/* Search Bar */}
  <div className="px-4 py-2">
    <div className="relative">
      <input
        type="text"
        placeholder={placeholders[placeholderIndex]}
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full h-[42px] pl-10 pr-4 rounded-full bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <AiOutlineSearch 
        size={20} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
      />
    </div>

    {/* Mobile Search Results */}
    {searchData && searchData.length > 0 && (
      <div className="absolute left-0 right-0 mt-2 mx-4 bg-white rounded-lg shadow-lg z-50 max-h-[50vh] overflow-y-auto">
        {searchData.map((item, index) => (
          <Link 
            key={index} 
            to={`/product/${item._id}`}
            className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
          >
            <img
              src={item.designImage?.url}
              alt=""
              className="w-12 h-12 object-cover rounded-md mr-3"
            />
            <span className="text-gray-800 text-sm line-clamp-2">{item.DesignTitle}</span>
          </Link>
        ))}
      </div>
    )}
  </div>
</div>
      

      {/* Sliding Menu */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300
          ${open ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        onClick={() => setOpen(false)}
      >
        <div
          className={`
            fixed top-0 left-0 h-full w-[280px] lg:w-[320px] bg-[#151523] 
            transform transition-transform duration-300 ease-out
            ${open ? "translate-x-0" : "-translate-x-full"}
          `}
          onClick={e => e.stopPropagation()}
        >
          {/* Menu Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <div className="relative" onClick={() => setOpenWishlist(true)}>
              <AiOutlineHeart size={28} className="text-white" />
              {wishlist?.length > 0 && (
                <span className="absolute -right-2 -top-2 bg-[#3bc177] w-5 h-5 rounded-full flex items-center justify-center text-white text-xs">
                  {wishlist.length}
                </span>
              )}
            </div>
            <RxCross1
              size={28}
              className="text-white cursor-pointer"
              onClick={() => setOpen(false)}
            />
          </div>

          {/* Menu Content */}
          <div className="p-4">
            <Link 
              to="/dashboard-create-product"
              className="flex items-center space-x-2 text-white mb-6"
            >
              <FiUpload />
              <span>Upload Your Art</span>
            </Link>

            {/* Navigation Links */}
            <div className="space-y-6">
              <Link to="/shop-designs" className="block">
                <h3 className="text-white text-lg font-bold">Shop Designs</h3>
                <p className="text-gray-400 text-sm">Discover classic designs and new artists</p>
              </Link>

              <Link to="/apparel" className="block">
                <h3 className="text-white text-lg font-bold">Apparel</h3>
                <p className="text-gray-400 text-sm">Shop for Adults & Kids</p>
              </Link>

              <Link to="/accessories" className="block">
                <h3 className="text-white text-lg font-bold">Accessories</h3>
                <p className="text-gray-400 text-sm">Express yourself with stickers and more</p>
              </Link>

              <Link to="/home-goods" className="block">
                <h3 className="text-white text-lg font-bold">Home Goods</h3>
                <p className="text-gray-400 text-sm">Decorate with pillows and tapestries</p>
              </Link>
            </div>

            {/* Popular Products Grid */}
            <div className="mt-8">
              <h2 className="text-white text-xl font-bold mb-4">Popular Products</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'T-Shirts', 'Hats', 'Stickers', 'Mugs',
                  'Kids T-Shirts', 'Hoodies', 'Tank Tops', 'Long Sleeve T-Shirts'
                ].map((product) => (
                  <Link
                    key={product}
                    to={`/${product.toLowerCase().replace(' ', '-')}`}
                    className="bg-[#232332] rounded-lg p-3 flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-[#3a3a4c] rounded-full flex-shrink-0" />
                    <span className="text-white text-sm">{product}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Shop All Designs Button */}
            <Link
              to="/shop-all-designs"
              className="block w-full bg-[#4e64df] text-white text-center py-3 rounded-full mt-6"
            >
              Shop All Designs
            </Link>

            {/* User Section */}
            <div className="mt-8 flex justify-center">
              {isAuthenticated ? (
                <Link to="/profile">
                  <img
                    src={user.avatar?.url}
                    alt=""
                    className="w-16 h-16 rounded-full border-3 border-[#0aae88]"
                  />
                </Link>
              ) : (
                <div className="space-x-2 text-white">
                  <Link to="/login" className="hover:text-gray-300">Login</Link>
                  <span>/</span>
                  <Link to="/sign-up" className="hover:text-gray-300">Sign up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Popup */}
      {openCart && (
        <div className="fixed inset-0 bg-black/50 z-[70]">
          <Cart setOpenCart={setOpenCart} />
        </div>
      )}

      {/* Wishlist Popup */}
      {openWishlist && (
        <div className="fixed inset-0 bg-black/50 z-[70]">
          <Wishlist setOpenWishlist={setOpenWishlist} />
        </div>
      )}
    </>
  );
};

export default Header;