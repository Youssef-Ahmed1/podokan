import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
      {/* HEADER_VERSION: 2023-06-15-001 */}
      <div className={`${active === true ? "shadow-sm fixed top-0 left-0 z-10" : null} transition hidden 800px:flex items-center justify-between w-full bg-[#151523] h-[70px]`}>
        <div className={`${styles.section} relative ${styles.noramlFlex} justify-between w-full`}>
          <div className="flex items-center">
            <GiHamburgerMenu size={40} className="cursor-pointer text-[#4e64df] mr-4" onClick={() => setOpen(true)} />
          </div>
          
          <div className="flex items-center flex-grow justify-center">
            <Link to="/" className="mr-4">
              <img src={siteLogo} alt="Site Logo" className="h-[60px] object-contain" />
            </Link>
            <div className="w-[50%] relative">
              <div className="w-full relative animate-border inline-block bg-white bg-gradient-to-r from-[#551c2c] via-[#b131ea] to-[#f2ad55] bg-[length:400%_400%] p-[2.5px] rounded-md">
                <input
                  type="text"
                  placeholder={placeholders[placeholderIndex]}
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

          <div className="flex items-center">
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
            <Link to="/dashboard-create-product" className="bg-[#4e64df] text-white px-4 py-2 rounded-full flex items-center whitespace-nowrap">
              <FiUpload className="mr-2" />
              Upload Your Art
            </Link>
          </div>
        </div>
      </div>

      {/* Side menu */}
      {open && (
        <div className="fixed w-full bg-[#0000005f] z-20 h-full top-0 left-0">
          <div className="fixed w-[70%] bg-[#151523] h-screen top-0 left-0 z-10 overflow-y-scroll">
            <div className="w-full justify-between flex pr-3">
              <div>
                <div
                  className="relative mr-[15px]"
                  onClick={() => setOpenWishlist(true) || setOpen(false)}
                >
                  <AiOutlineHeart size={30} className="mt-5 ml-3 text-white" />
                  <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                    {wishlist && wishlist.length}
                  </span>
                </div>
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
              <Link to="/shop-designs" className="block text-white text-xl font-bold mb-2 px-4">
                Shop Designs
                <span className="text-sm block text-gray-400">Discover a classic design or new favorite artist</span>
              </Link>
              <Link to="/apparel" className="block text-white text-xl font-bold mb-2 px-4">
                Apparel
                <span className="text-sm block text-gray-400">Shop for Adults & Kids</span>
              </Link>
              <Link to="/accessories" className="block text-white text-xl font-bold mb-2 px-4">
                Accessories
                <span className="text-sm block text-gray-400">Express yourself with stickers and more</span>
              </Link>
              <Link to="/home-goods" className="block text-white text-xl font-bold mb-4 px-4">
                Home Goods
                <span className="text-sm block text-gray-400">Decorate with pillows, tapestries, and more</span>
              </Link>
            </div>

            <div className="px-4">
              <h2 className="text-white text-xl font-bold mb-2">Popular Products</h2>
              <div className="grid grid-cols-2 gap-4">
                {['T-Shirts', 'Hats', 'Stickers', 'Mugs', 'Kids T-Shirts', 'Hoodies', 'Tank Tops', 'Long Sleeve T-Shirts'].map((product) => (
                  <Link key={product} to={`/${product.toLowerCase().replace(' ', '-')}`} className="bg-[#232332] rounded-lg p-2 flex items-center">
                    <div className="w-8 h-8 bg-[#3a3a4c] rounded-full mr-2"></div>
                    <span className="text-white">{product}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="px-4 mt-4">
              <Link to="/shop-all-designs" className="block w-full bg-[#4e64df] text-white text-center py-3 rounded-full">
                Shop All Designs
              </Link>
            </div>

            <br />
            <br />
            <br />

            <div className="flex w-full justify-center">
              {isAuthenticated ? (
                <div>
                  <Link to="/profile">
                    <img
                      src={`${user.avatar?.url}`}
                      alt=""
                      className="w-[60px] h-[60px] rounded-full border-[3px] border-[#0eae88]"
                    />
                  </Link>
                </div>
              ) : (
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

      {/* mobile header */}
      <div className={`${active === true ? "shadow-sm fixed top-0 left-0 z-10" : null} w-full bg-[#151523] z-50 top-0 left-0 shadow-sm 800px:hidden`}>
        <div className="w-full flex items-center justify-between p-4">
          <div>
            <GiHamburgerMenu
              size={40}
              className="ml-1 text-[#4e64df]"
              onClick={() => setOpen(true)}
            />
          </div>
          <div>
            <Link to="/">
              <img src={siteLogo} alt="Site Logo" className="h-[60px]" />
            </Link>
          </div>
          <div className="flex">
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
        <div className="w-full px-4 pb-4">
          <div className="w-full relative animate-border inline-block bg-white bg-gradient-to-r from-[#551c2c] via-[#b131ea] to-[#f2ad55] bg-[length:400%_400%] p-[2.5px] rounded-md">
            <input
              type="text"
              placeholder="Search Product..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-[40px] w-full px-2 rounded-md bg-[#151523] text-white"
            />
            <div className="absolute bg-black w-[41px] h-[41px] right-[3px] top-[2px] flex items-center justify-center rounded-r-md">
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

      {/* cart popup */}
      {openCart ? (
        <div className="fixed top-0 left-0 w-full h-screen bg-[#0000004b] z-50">
          <Cart setOpenCart={setOpenCart} />
        </div>
      ) : null}

      {/* wishlist popup */}
      {openWishlist ? (
        <div className="fixed top-0 left-0 w-full h-screen bg-[#0000004b] z-50">
          <Wishlist setOpenWishlist={setOpenWishlist} />
        </div>
      ) : null}
    </>
  );
};

export default Header;