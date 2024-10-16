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
import { categoriesData, navItems } from "../../static/data";
import ArtistSign from "./ArtistSign";

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
    "Searching for a trend maybe? "
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
      <div className={`${active === true ? "shadow-sm fixed top-0 left-0 z-10" : null} transition-all duration-300 ease-in-out bg-[#1a1a2e] text-white`}>
        <div className={`${styles.section} relative ${styles.noramlFlex} justify-between`}>
          <div className="flex items-center">
            <BiMenuAltLeft
              size={30}
              className="cursor-pointer 800px:hidden"
              onClick={() => setOpen(true)}
            />
            <Link to="/">
              <img
                src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                alt=""
                className="h-[50px] ml-2 800px:ml-0"
              />
            </Link>
          </div>
          <div className="w-[50%] relative hidden 800px:block">
            <input
              type="text"
              placeholder={placeholders[placeholderIndex]}
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-[40px] w-full px-2 border-[#3957db] border-[2px] rounded-full text-black"
            />
            <AiOutlineSearch
              size={30}
              className="absolute right-2 top-1.5 cursor-pointer text-[#3957db]"
            />
            {searchData && searchData.length !== 0 ? (
              <div className="absolute min-h-[30vh] bg-slate-50 shadow-sm-2 z-[9] p-4 w-full text-black">
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
          <div className="flex items-center">
            <div className="flex">
              <div
                className="relative cursor-pointer mr-[15px]"
                onClick={() => setOpenWishlist(true)}
              >
                <AiOutlineHeart size={30} color="rgb(255 255 255 / 83%)" />
                <span className="absolute -right-2 -top-2 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                  {wishlist && wishlist.length}
                </span>
              </div>
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

            <div className="flex">
              <div className="relative cursor-pointer mr-[15px]">
                {isAuthenticated ? (
                  <Link to="/profile">
                    <img
                      src={`${user?.avatar?.url}`}
                      className="w-[35px] h-[35px] rounded-full"
                      alt=""
                    />
                  </Link>
                ) : (
                  <Link to="/login" className="text-white">
                    Login
                  </Link>
                )}
              </div>
            </div>

            <div className="hidden 800px:block">
              <Link to={isSeller ? "/dashboard" : "/shop-create"}>
                <button className="bg-[#4e64df] text-white px-4 py-2 rounded-full text-sm flex items-center">
                  <FiUpload className="mr-2" />
                  {isSeller ? "Dashboard" : "Upload Art"}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#2a2a40] py-2 hidden 800px:block">
        <div className={`${styles.section} relative`}>
          <Navbar active={activeHeading} />
        </div>
      </div>

      {/* mobile header */}
      <div
        className={`${
          active === true ? "shadow-sm fixed top-0 left-0 z-10" : null
        } w-full bg-[#121212] z-50 top-0 left-0 shadow-sm 800px:hidden`}
      >
        <div className="w-full flex items-center justify-between p-4">
          <div>
            <BiMenuAltLeft
              size={40}
              className="ml-1 text-[#4e64df]"
              onClick={() => setOpen(true)}
            />
          </div>
          <div>
            <Link to="/">
              <img
                src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                alt=""
                className="w-[100px]"
              />
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
            <div className="relative cursor-pointer mr-[15px]">
              {isAuthenticated ? (
                <Link to="/profile">
                  <img
                    src={`${user?.avatar?.url}`}
                    className="w-[35px] h-[35px] rounded-full"
                    alt=""
                  />
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* mobile search bar */}
        <div className="w-full px-4 pb-4 pt-1">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Search Product..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-[40px] w-full px-2 border-[#3957db] border-[2px] rounded-md"
            />
            <AiOutlineSearch
              size={30}
              className="absolute right-2 top-1.5 cursor-pointer text-[#3957db]"
            />
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

        {/* mobile sidebar */}
        {open && (
          <div className={`fixed w-full bg-[#0000005f] z-20 h-full top-0 left-0`}>
            <div className="fixed w-[70%] bg-[#fff] h-screen top-0 left-0 z-10 overflow-y-scroll">
              <div className="w-full justify-between flex pr-3">
                <div>
                  <div
                    className="relative mr-[15px]"
                    onClick={() => setOpenWishlist(true) || setOpen(false)}
                  >
                    <AiOutlineHeart size={30} className="mt-5 ml-3" />
                    <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px]  leading-tight text-center">
                      {wishlist && wishlist.length}
                    </span>
                  </div>
                </div>
                <RxCross1
                  size={30}
                  className="ml-4 mt-5"
                  onClick={() => setOpen(false)}
                />
              </div>

              <Navbar active={activeHeading} />
              <div className="w-full mt-5 px-4">
                <Link to={`${isSeller ? "/dashboard" : "/shop-create"}`}>
                  <div className="w-full h-[40px] bg-[#4e64df] rounded-xl flex items-center justify-center text-white font-semibold">
                    {isSeller ? "Go Dashboard" : "Artist SignUp"}{" "}
                    <FiArrowRight className="ml-1" />
                  </div>
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
                      className="text-[18px] pr-[10px] text-[#000000b7]"
                    >
                      Login /
                    </Link>
                    <Link
                      to="/sign-up"
                      className="text-[18px] text-[#000000b7]"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* cart popup */}
      {openCart ? (
        <div className="fixed top-0 left-0 w-full h-screen bg-[#0000004b] z-50">
          <div className="fixed top-0 right-0 min-h-full w-[80%] 800px:w-[25%] bg-white flex flex-col justify-between shadow-sm">
            <Cart setOpenCart={setOpenCart} />
          </div>
        </div>
      ) : null}

      {/* wishlist popup */}
      {openWishlist ? (
        <div className="fixed top-0 left-0 w-full h-screen bg-[#0000004b] z-50">
          <div className="fixed top-0 right-0 min-h-full w-[80%] 800px:w-[25%] bg-white flex flex-col justify-between shadow-sm">
            <Wishlist setOpenWishlist={setOpenWishlist} />
          </div>
        </div>
      ) : null}

      <ArtistSign />
    </>
  );
};

export default Header;