import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../../styles/styles";
import {
  AiOutlineHeart,
  AiOutlineSearch,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { FiUpload, FiArrowRight } from "react-icons/fi";
import { BiMenuAltLeft } from "react-icons/bi";
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
      <div className={`${active === true ? "shadow-sm fixed top-0 left-0 z-10" : null} transition hidden 800px:flex items-center justify-between w-full bg-[#151523] h-[70px]`}>
        <div className="flex items-center ml-2">
          <BiMenuAltLeft size={30} className="cursor-pointer text-[#4e64df] mr-2" onClick={() => setOpen(true)} />
          <Link to="/">
            <img src={siteLogo} alt="Site Logo" className="h-[200px] object-contain" />
          </Link>
        </div>
        <div className="flex items-center justify-center flex-grow">
          <div className="w-[50%] relative">
            <div className="w-full relative animate-border inline-block bg-white bg-gradient-to-r from-[#551c2c] via-[#b131ea] to-[#f2ad55] bg-[length:400%_400%] p-[2.5px] rounded-md">
              <input
                type="text"
                placeholder="Search Product..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-[50px] w-full px-4 rounded-md bg-[#151523] text-white"
              />
              <div className="absolute bg-black w-[51px] h-[51px] right-[3px] top-[2px] flex items-center justify-center rounded-r-md">
                <AiOutlineSearch size={20} className="cursor-pointer text-white" />
              </div>
            </div>
            {searchData && searchData.length !== 0 ? (
              <div className="absolute min-h-[30vh] bg-slate-50 shadow-sm-2 z-[9] p-4 w-full">
                {searchData.map((i, index) => (
                  <Link key={index} to={`/product/${i._id}`}>
                    <div className="w-full flex items-start py-3">
                      <img
                        src={`${i.designImage?.url}`}
                        alt=""
                        className="w-[40px] h-[40px] mr-[10px]"
                      />
                      <h1>{i.DesignTitle}</h1>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center mr-2">
          <div className="flex items-center mr-4">
            <div className="relative cursor-pointer mr-[15px]" onClick={() => setOpenWishlist(true)}>
              <AiOutlineHeart size={30} color="rgb(255 255 255 / 83%)" />
              <span className="absolute -right-2 -top-2 rounded-full bg-[#f6b92e] w-5 h-5 p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                {wishlist && wishlist.length}
              </span>
            </div>
            <div className="relative cursor-pointer mr-[15px]" onClick={() => setOpenCart(true)}>
              <AiOutlineShoppingCart size={30} color="rgb(255 255 255 / 83%)" />
              <span className="absolute -right-2 -top-2 rounded-full bg-[#f6b92e] w-5 h-5 p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                {cart && cart.length}
              </span>
            </div>
            {isAuthenticated ? (
              <Link to="/profile">
                <img
                  src={`${user?.avatar?.url}`}
                  className="w-[35px] h-[35px] rounded-full mr-[15px]"
                  alt=""
                />
              </Link>
            ) : (
              <Link to="/login" className="text-white mr-[15px]">
                Login
              </Link>
            )}
          </div>
          <Link to="/dashboard-create-product" className="bg-[#4e64df] text-white px-4 py-2 rounded-full flex items-center hover:bg-[#3a4fc7] transition-all duration-300">
            <FiUpload className="mr-2" />
            Upload Your Art
          </Link>
        </div>
      </div>

      {/* mobile header */}
      <div className={`${active === true ? "shadow-sm fixed top-0 left-0 z-10" : null} w-full bg-[#151523] z-50 top-0 left-0 shadow-sm 800px:hidden`}>
        <div className="w-full flex items-center justify-between h-[60px]">
          <div className="ml-4">
            <BiMenuAltLeft
              size={40}
              className="ml-4 text-[#4e64df]"
              onClick={() => setOpen(true)}
            />
          </div>
          <div className="flex items-center">
            <Link to="/">
              <img src={siteLogo} alt="Site Logo" className="h-[60px] mx-auto" />
            </Link>
          </div>
          <div className="flex mr-4">
            <div
              className="relative cursor-pointer mr-[15px]"
              onClick={() => setOpenCart(true)}
            >
              <AiOutlineShoppingCart
                size={30}
                color="rgb(255 255 255 / 83%)"
              />
              <span className="absolute -right-2 -top-2 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                {cart && cart.length}
              </span>
            </div>
          </div>
        </div>

        {/* mobile search bar */}
        <div className="w-full px-4 pb-4 pt-1">
          <div className="w-full relative animate-border inline-block bg-white bg-gradient-to-r from-[#551c2c] via-[#b131ea] to-[#f2ad55] bg-[length:400%_400%] p-[2.5px] rounded-md">
            <input
              type="search"
              placeholder="Search Product..."
              className="h-[40px] w-full px-2 rounded-md bg-[#151523] text-white"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className="absolute bg-black w-[41px] h-[41px] right-[3px] top-[2px] flex items-center justify-center rounded-r-md">
              <AiOutlineSearch size={20} className="cursor-pointer text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Side menu */}
      {open && (
        <div className="fixed w-full bg-[#0000005f] z-20 h-full top-0 left-0">
          <div className="fixed w-[50%] bg-[#151523] h-screen top-0 left-0 z-10 overflow-y-scroll">
            <div className="w-full justify-between flex pr-3">
              <div className="flex items-center">
                <div
                  className="relative mr-[15px]"
                  onClick={() => setOpenWishlist(true) || setOpen(false)}
                >
                  <AiOutlineHeart size={30} className="mt-5 ml-3 text-white" />
                  <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                    {wishlist && wishlist.length}
                  </span>
                </div>
                {isAuthenticated && (
                  <Link to="/profile" className="mt-5 ml-2">
                    <img
                      src={`${user?.avatar?.url}`}
                      className="w-[30px] h-[30px] rounded-full"
                      alt=""
                    />
                  </Link>
                )}
              </div>
              <RxCross1
                size={30}
                className="ml-4 mt-5 text-white"
                onClick={() => setOpen(false)}
              />
            </div>

            <div className="my-8 w-full h-[40px relative]">
              <Link to="/dashboard-create-product" className="text-[16px] text-[#fff] pl-[36px] flex items-center">
                <FiUpload className="mr-2" />
                Upload Your Art
              </Link>
            </div>

            <div className="mb-4">
              <Link to="/shop-designs" className="block text-white text-xl font-bold mb-2 px-4 hover:bg-[#232332] transition-all duration-300">
                Shop Designs
                <span className="text-sm block text-gray-400">Discover a classic design or new favorite artist</span>
                <FiArrowRight className="inline-block ml-2" />
              </Link>
              <Link to="/apparel" className="block text-white text-xl font-bold mb-2 px-4 hover:bg-[#232332] transition-all duration-300">
                Apparel
                <span className="text-sm block text-gray-400">Shop for Adults & Kids</span>
                <FiArrowRight className="inline-block ml-2" />
              </Link>
              <Link to="/accessories" className="block text-white text-xl font-bold mb-2 px-4 hover:bg-[#232332] transition-all duration-300">
                Accessories
                <span className="text-sm block text-gray-400">Express yourself with stickers and more</span>
                <FiArrowRight className="inline-block ml-2" />
              </Link>
              <Link to="/home-goods" className="block text-white text-xl font-bold mb-4 px-4 hover:bg-[#232332] transition-all duration-300">
                Home Goods
                <span className="text-sm block text-gray-400">Decorate with pillows, tapestries, and more</span>
                <FiArrowRight className="inline-block ml-2" />
              </Link>
            </div>

            <div className="px-4">
              <h2 className="text-white text-xl font-bold mb-2">Popular Products</h2>
              <div className="grid grid-cols-2 gap-4">
                {['T-Shirts', 'Hats', 'Stickers', 'Mugs', 'Kids T-Shirts', 'Hoodies', 'Tank Tops', 'Long Sleeve T-Shirts'].map((product) => (
                  <Link key={product} to={`/${product.toLowerCase().replace(' ', '-')}`} className="bg-[#232332] rounded-lg p-2 flex items-center hover:bg-[#2e2e3e] transition-all duration-300">
                    <div className="w-8 h-8 bg-[#3a3a4c] rounded-full mr-2"></div>
                    <span className="text-white">{product}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="px-4 mt-4">
              <Link to="/shop-all-designs" className="block w-full bg-[#4e64df] text-white text-center py-3 rounded-full hover:bg-[#3a4fc7] transition-all duration-300">
                Shop All Designs
              </Link>
            </div>

            <br />
            <br />
            <br />

            <div className="flex w-full justify-center">
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="text-[18px] pr-[10px] text-[#fff]"
                  >
                    Login /
                  </Link>
                  <Link
                    to="/sign-up"
                    className="text-[18px] text-[#fff]"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* cart popup */}
      {openCart ? (
        <Cart setOpenCart={setOpenCart} />
      ) : null}

      {/* wishlist popup */}
      {openWishlist ? (
        <Wishlist setOpenWishlist={setOpenWishlist} />
      ) : null}
    </>
  );
};

export default Header;