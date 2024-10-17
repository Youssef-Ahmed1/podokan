import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../../styles/styles";
import {
  AiOutlineHeart,
  AiOutlineSearch,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { FiArrowRight, FiUpload } from "react-icons/fi";
import { BiMenuAltLeft } from "react-icons/bi";
import Navbar from "./Navbar";
import { useSelector } from "react-redux";
import Cart from "../cart/Cart";
import Wishlist from "../Wishlist/Wishlist";
import { RxCross1 } from "react-icons/rx";
import siteLogo from "../../Assests/siteLogo.svg";

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
      <div className={`${active === true ? "shadow-sm fixed top-0 left-0 z-10" : null} transition hidden 800px:flex flex-col items-center justify-between w-full bg-[#151523]`}>
        <div className={`${styles.section} relative ${styles.noramlFlex} justify-between w-full h-[70px]`}>
          <div className="flex items-center">
            <BiMenuAltLeft size={30} className="cursor-pointer text-white mr-2" onClick={() => setOpen(true)} />
          </div>
          <div>
            <Link to="/" className="text-white">
              <img src={siteLogo} alt="Site Logo" className="h-[154px]" />
            </Link>
          </div>
          <div className="flex items-center justify-center flex-grow">
            <div className="w-[60%] relative">
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
            <Link to="/dashboard-create-product" className="bg-[#4e64df] text-white px-4 py-2 rounded-full flex items-center whitespace-nowrap">
              <FiUpload className="mr-2" />
              Upload Your Art
            </Link>
          </div>
        </div>
        
        {/* navitems */}
        <div className="w-full bg-[#151523] h-[60px] flex items-center justify-center border-t border-gray-600">
          <div className={`${styles.section} relative ${styles.noramlFlex}`}>
            <Navbar active={activeHeading} />
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
              <Link to="/trending" className="text-[16px] text-[#fff] pl-[36px] block mb-4">Trending</Link>
              <Link to="/bestsellers" className="text-[16px] text-[#fff] pl-[36px] block mb-4">Bestsellers</Link>
              <Link to="/contact-us" className="text-[16px] text-[#fff] pl-[36px] block mb-4">Contact Us</Link>
              <Link to="/faq" className="text-[16px] text-[#fff] pl-[36px] block mb-4">FAQ</Link>
            </div>
          </div>
        </div>
      )}

      {/* mobile header */}
      <div className={`${active === true ? "shadow-sm fixed top-0 left-0 z-10" : null} w-full bg-[#151523] z-50 top-0 left-0 shadow-sm 800px:hidden`}>
        <div className="w-full flex items-center justify-between p-4">
          <div>
            <BiMenuAltLeft
              size={40}
              className="ml-1 text-white"
              onClick={() => setOpen(true)}
            />
          </div>
          <div>
            <Link to="/">
              <img src={siteLogo} alt="Site Logo" className="h-[50px]" />
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