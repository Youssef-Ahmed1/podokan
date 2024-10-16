import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../../styles/styles";
import {
  AiOutlineHeart,
  AiOutlineSearch,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { FiArrowRight } from "react-icons/fi";
import { BiMenuAltLeft } from "react-icons/bi";
import Navbar from "./Navbar";
import { useSelector } from "react-redux";
import Cart from "../cart/Cart";
import Wishlist from "../Wishlist/Wishlist";
import { RxCross1 } from "react-icons/rx";
import { categoriesData } from "../../static/data";

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
      <div className={`${active === true ? "shadow-sm fixed top-0 left-0 z-10" : null} transition hidden 800px:flex items-center justify-between w-full bg-[#151523] h-[70px] px-4`}>
        <div className="flex items-center">
          <BiMenuAltLeft size={30} className="cursor-pointer text-white mr-2" onClick={() => setOpen(!open)} />
          <Link to="/" className="text-[#f6b92e] text-3xl font-bold flex items-center">
            <img src="https://shopo.quomodothemes.website/assets/images/logo.svg" alt="" className="h-8 mr-2" />
            Shop
          </Link>
        </div>
        <div className="w-[50%] relative">
          <input
            type="text"
            placeholder="searching for a trend maybe?"
            value={searchTerm}
            onChange={handleSearchChange}
            className="h-[40px] w-full px-4 rounded-full bg-[#232332] text-white"
          />
          <AiOutlineSearch
            size={20}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-white"
          />
          {searchData && searchData.length !== 0 ? (
            <div className="absolute min-h-[30vh] bg-slate-50 shadow-sm-2 z-[9] p-4 w-full rounded-b-md">
              {searchData.map((i, index) => (
                <Link to={`/product/${i._id}`} key={index}>
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
          <Link to="/dashboard-create-product" className="bg-[#4e64df] text-white px-4 py-2 rounded-full">
            {isSeller ? "Dashboard" : "Dashboard"}
          </Link>
        </div>
      </div>

      {/* Category bar */}
      <div className="w-full bg-[#232332] h-[60px] hidden 800px:flex items-center justify-center">
        <Navbar active={activeHeading} />
      </div>

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
              <span className="absolute -right-2 -top-2 rounded-full bg-[#f6b92e] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                {cart && cart.length}
              </span>
            </div>
          </div>
        </div>

        {/* mobile search bar */}
        <div className="w-full px-4 pb-4">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Search Product..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-[40px] w-full px-2 rounded-full bg-[#232332] text-white"
            />
            <AiOutlineSearch
              size={30}
              className="absolute right-2 top-1.5 cursor-pointer text-white"
            />
            {searchData && searchData.length !== 0 ? (
              <div className="absolute min-h-[30vh] bg-slate-50 shadow-sm-2 z-[9] p-4 w-full rounded-b-md">
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
          <div className="fixed w-full bg-[#0000005f] z-20 h-full top-0 left-0">
            <div className="fixed w-[70%] bg-[#151523] h-screen top-0 left-0 z-10 overflow-y-scroll">
              <div className="w-full justify-between flex pr-3">
                <div>
                  <div
                    className="relative mr-[15px]"
                    onClick={() => setOpenWishlist(true) || setOpen(false)}
                  >
                    <AiOutlineHeart size={30} className="mt-5 ml-3 text-white" />
                    <span className="absolute right-0 top-0 rounded-full bg-[#f6b92e] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
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

              <div className="my-8 w-full h-[40px] flex items-center justify-center px-4">
                <Link to="/dashboard-create-product" className="w-full bg-[#4e64df] h-[40px] rounded-full flex items-center justify-center text-white font-semibold">
                  {isSeller ? "Dashboard" : "Become a Seller"}
                </Link>
              </div>

              <Navbar active={activeHeading} />

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
                      className="text-[18px] pr-[10px] text-white"
                    >
                      Login /
                    </Link>
                    <Link
                      to="/sign-up"
                      className="text-[18px] text-white"
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