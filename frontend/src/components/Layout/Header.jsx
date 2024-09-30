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
      <div className="flex">
        <div className="800px:my-[0px] 800px:flex items-center justify-between">
        </div>
      </div>
      <div
        className={`${
          active === true ? "shadow-sm fixed top-0 left-0  z-10" : null
        } transition hidden 800px:flex items-center justify-between w-full  bg-[#151523] h-[146px]`}
      >
        <div
          className={`${styles.section} relative ${styles.noramlFlex} justify-between`}
        >
           <div>
            <Link to="/">
              <img
                src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                alt="" className="relative left-[363px]  bottom-[27px] "
              />
            </Link>
          </div>
                  {/* search box */}
                  <div className="
                  w-[40%] relative animate-border inline-block
               bg-white bg-gradient-to-r
                from-[#551c2c] via-[#b131ea]  to-[#f2ad55]
                bg-[length:400%_400%] p-[2.5px] rounded-md left-[370px] bottom-[27px]" >  
           <input
            type="text"
            placeholder={placeholders[placeholderIndex]}
            value={searchTerm}
            onChange={handleSearchChange}
            className="h-[50px] w-full rounded-md bg-[length:400%_400%] p-[2px] border-[1px]"
          />
            <div className=" absolute bg-black w-[51px] h-[51px] right-[3px] top-[2px] flex items-center justify-center rounded-r-md
            "     >
            <AiOutlineSearch
              size={20}
              className="relative  cursor-pointer  text-[white] "  
              
            />
            </div>
            {searchData && searchData.length !== 0 ? (
              <div className="absolute min-h-[30vh] bg-slate-50 shadow-sm-2 z-[9] p-4">
                {searchData &&
                  searchData.map((i, index) => {
                    return (
                      <Link to={`/product/${i._id}`} key={index}>
                        <div className="w-full flex items-start-py-3">
                          <img
                            src={`${i.designImage?.url}`}
                            alt=""
                            className="w-[40px] h-[40px] mr-[10px]"
                          />
                          <h1>{i.DesignTitle}</h1>
                        </div>
                      </Link>
                    ); 
                  })}
              </div>
            ) : null}
          </div>
          {/* navitems */}
          <div className=" flex relative left-[-383px] bottom-[-30px] ">
            <div>
            <Navbar active={activeHeading}   />
            </div>
          </div>

          <div className="flex  relative right-[30px] top-[55px ]">
            <div className={`${styles.noramlFlex}`}>
              <div
                className="relative cursor-pointer mr-[15px]"
                onClick={() => setOpenWishlist(true)}
              >
                <AiOutlineHeart size={30} color="rgb(255 255 255 / 83%)" />
                <span className="absolute right-0 top-0 rounded-full bg-[red] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                  {wishlist && wishlist.length}
                </span>
              </div>
            </div>

            <div className={`${styles.noramlFlex}`}>
              <div
                className="relative cursor-pointer mr-[15px]"
                onClick={() => setOpenCart(true)}
              >
                <AiOutlineShoppingCart
                  size={30}
                  color="rgb(255 255 255 / 83%)"
                />
                <span className="absolute right-0 top-0 rounded-full bg-[red] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                  {cart && cart.length}
                </span>
              </div>
            </div>

            <div className={`${styles.noramlFlex}`}>
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
                  <Link to="/sign-up">
                    <div className="
                    w-[150px] h-[42px] 
                     bg-[#4e64df] rounded-xl 
                     font-semibold left-[1px] 
                     bottom-[45px] relative
                      z-10 flex items-center
                      justify-center top-[8px]
                      
                      "
                      >

                                 <div className=" text-stone-100 ">create Account</div>
                                 </div>

                  </Link>
                   
                )}
              </div>
            </div>
           
            {/* cart popup */}
            {openCart ? <Cart setOpenCart={setOpenCart} /> : null}

            {/* wishlist popup */}
            {openWishlist ? (
              <Wishlist setOpenWishlist={setOpenWishlist} />
            ) : null}
          </div>
        </div>
      </div>
        

      {/* mobile header */}
      <div
        className={`${
          active === true ? "shadow-sm fixed top-0 left-0 z-10" : null
        }
      w-full bg-[#121212] z-50 top-0 left-0 shadow-sm 800px:hidden`}
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
              <span className="absolute right-0 top-0 rounded-full bg-[red] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
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
        <div className="w-full px-4 pb-4">
          <div className="w-full relative animate-border inline-block bg-white bg-gradient-to-r from-[#551c2c] via-[#b131ea] to-[#f2ad55] bg-[length:400%_400%] p-[2.5px] rounded-md">
            <input
              type="text"
              placeholder="Search Product..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-[40px] w-full px-2 rounded-md"
            />
            <AiOutlineSearch
              size={30}
              className="absolute right-2 top-1.5 cursor-pointer text-[#4e64df]"
            />
            {searchData && searchData.length !== 0 ? (
              <div className="absolute min-h-[30vh] bg-slate-50 shadow-sm-2 z-[9] p-4">
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

    
    </>
  );
};



export default Header;