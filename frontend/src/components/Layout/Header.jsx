import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "../../styles/styles";
import {
  AiOutlineHeart,
  AiOutlineSearch,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { BiMenuAltLeft } from "react-icons/bi";
import Navbar from "./Navbar";
import { useSelector } from "react-redux";
import Cart from "../cart/Cart";
import Wishlist from "../Wishlist/Wishlist";
import { RxCross1 } from "react-icons/rx";

const Header = ({ activeHeading }) => {
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { allProducts } = useSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchData, setSearchData] = useState(null);
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

  return (
    <>
      <div className="bg-[#151523] w-full h-[146px]">
        <div className={`${styles.section} h-full`}>
          <div className="h-[70px] flex items-center justify-between">
            <div>
              <Link to="/">
                <img
                  src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                  alt=""
                  className="h-[50px]"
                />
              </Link>
            </div>
            <div className="w-[50%] relative">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-[40px] w-full px-2 border-[#3957db] border-[2px] rounded-md"
              />
              <AiOutlineSearch
                size={30}
                className="absolute right-2 top-1.5 cursor-pointer"
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
            <div className="flex items-center">
              <div className="relative cursor-pointer mr-[25px]" onClick={() => setOpenWishlist(true)}>
                <AiOutlineHeart size={30} color="rgb(255 255 255 / 83%)" />
                <span className="absolute -right-2 -top-2 rounded-full bg-[#3bc177] w-[18px] h-[18px] p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                  {wishlist && wishlist.length}
                </span>
              </div>
              <div className="relative cursor-pointer mr-[25px]" onClick={() => setOpenCart(true)}>
                <AiOutlineShoppingCart size={30} color="rgb(255 255 255 / 83%)" />
                <span className="absolute -right-2 -top-2 rounded-full bg-[#3bc177] w-[18px] h-[18px] p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                  {cart && cart.length}
                </span>
              </div>
              {isAuthenticated ? (
                <Link to="/profile">
                  <img
                    src={`${user?.avatar?.url}`}
                    className="w-[35px] h-[35px] rounded-full"
                    alt=""
                  />
                </Link>
              ) : (
                <Link to="/login" className="text-white bg-[#3957db] px-4 py-2 rounded-md hover:bg-[#2a3f9d] transition-all duration-300 ease-in-out">
                  Login
                </Link>
              )}
            </div>
          </div>
          <div className="h-[76px] flex items-center">
            <Navbar active={activeHeading} />
          </div>
        </div>
      </div>

      {/* mobile header */}
      <div className="w-full h-[60px] fixed top-0 left-0 z-50 bg-[#121212] shadow-sm 800px:hidden">
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
              <span className="absolute -right-2 -top-2 rounded-full bg-[#3bc177] w-[18px] h-[18px] p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                {cart && cart.length}
              </span>
            </div>
          </div>
        </div>

        {/* mobile sidebar */}
        {open && (
          <div className="fixed top-0 left-0 w-full h-full bg-[#0000005f] z-20">
            <div className="fixed top-0 left-0 w-[70%] h-screen bg-[#fff] z-10 overflow-y-scroll">
              <div className="w-full justify-between flex pr-3">
                <div>
                  <div
                    className="relative mr-[15px]"
                    onClick={() => setOpenWishlist(true) || setOpen(false)}
                  >
                    <AiOutlineHeart size={30} className="mt-5 ml-3" />
                    <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-[18px] h-[18px] p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
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

              <div className="my-8 w-[92%] m-auto h-[40px relative]">
                <input
                  type="search"
                  placeholder="Search Product..."
                  className="h-[40px] w-full px-2 border-[#3957db] border-[2px] rounded-md"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchData && (
                  <div className="absolute bg-[#fff] z-10 shadow w-full left-0 p-3">
                    {searchData.map((i) => {
                      const d = i.DesignTitle;

                      return (
                        <Link to={`/product/${i._id}`}>
                          <div className="flex items-center">
                            <img
                              src={i.designImage?.url}
                              alt=""
                              className="w-[50px] mr-2"
                            />
                            <h5>{d.slice(0, 40)}...</h5>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
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
          <div className="fixed top-0 right-0 h-full w-[80%] 800px:w-[25%] bg-white flex flex-col overflow-y-scroll justify-between shadow-sm">
            <Cart setOpenCart={setOpenCart} />
          </div>
        </div>
      ) : null}

      {/* wishlist popup */}
      {openWishlist ? (
        <div className="fixed top-0 left-0 w-full h-screen bg-[#0000004b] z-50">
          <div className="fixed top-0 right-0 h-full w-[80%] 800px:w-[25%] bg-white flex flex-col overflow-y-scroll justify-between shadow-sm">
            <Wishlist setOpenWishlist={setOpenWishlist} />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Header;