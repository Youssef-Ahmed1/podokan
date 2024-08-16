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
    }, 2000); // Change placeholder every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    const filteredProducts =
      allProducts &&
      allProducts.filter((product) =>
        product.name.toLowerCase().includes(term.toLowerCase())
      );
    setSearchData(filteredProducts);
  };

  window.addEventListener("scroll", () => {
    if (window.scrollY > 1200) {
      setActive(true);
    } else {
      setActive(false);
    }
  });

  return (
    <>
    
      <div className="flex">
        <div className="  800px:my-[0px] 800px:flex items-center justify-between">
      
        </div>
      </div>
      <div
        className={`${
          active === true ? "shadow-sm absolute top-0 left-0  z-10" : null
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
                      <Link to={`/product/${i._id}`}>
                        <div className="w-full flex items-start-py-3">
                          <img
                            src={`${i.images[0]?.url}`}
                            alt=""
                            className="w-[40px] h-[40px] mr-[10px]"
                          />
                          <h1>{i.name}</h1>
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
          active === true ? "shadow-sm absolute top-0 left-0 z-10" : null
        }
      w-full h-[115px] bg-[#121212] z-50 top-0 left-0 shadow-sm 800px:hidden`}
      >

        <div className="w-full flex items-center justify-between ">
          <div className="text-[#4e64df]">
            <BiMenuAltLeft
              size={40}
              className="ml-1 "
              onClick={() => setOpen(true)}
            />
          </div>
          <div className="text-[#fff] absolute right-[270px] top-[10px] text-lg" > Menu</div>
          <div>
            <Link to="/">
              <img
                src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                alt=""
                className="mt-[-13px] left-[128px] cursor-pointer absolute"
              />
            </Link>
          </div>
          <div>
           <div className=" w-[351px]  h-[44px] absolute animate-border inline-block 
               bg-white bg-gradient-to-r
                from-[#8d4358] via-[#39eea6]  to-[#b131ea]
                bg-[length:500%_500%] p-[2px] rounded-md left-[4px] top-[61px] ">
                <input
                  type="search"
                  placeholder="Search Product..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="h-[40px] w-full rounded-md bg-[length:400%_400%] p-[2px] border-[1px]"
               
                />
                   <div className=" absolute bg-black w-[38px] h-[38px] right-[3px] top-[3px] flex items-center justify-center  rounded-r-md" >
            <AiOutlineSearch size={30} className="relative cursor-pointer text-[white] " />
              </div>
                {searchData && (
                  <div className="absolute bg-[#fff] z-10 shadow w-full left-0 p-3">
                    {searchData.map((i) => {
                      const d = i.name;

                      const Product_name = d.replace(/\s+/g, "-");
                      return (
                        <Link to={`/product/${Product_name}`}>
                          <div className="flex items-center">
                            <img
                              src={i.image_Url[0]?.url}
                              alt=""
                              className="w-[50px] mr-2"
                            />
                            <h5>{i.name}</h5>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
              </div>
                <div
                className="relative mr-[16px] text-[#4e64df]  "
                onClick={() => setOpenCart(true)}
              >
                <AiOutlineShoppingCart size={30}  />
                <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px]  leading-tight text-center ">
                  {cart && cart.length}
                </span>
              </div>
            </div>
            {/* cart popup */}
            {openCart ? <Cart setOpenCart={setOpenCart} /> : null}
            </div>
            {/* wishlist popup */}
          {openWishlist ? <Wishlist setOpenWishlist={setOpenWishlist} /> : null}
        

        {/* header sidebar */}
        {open && (
          <div
            className={`fixed w-full bg-[#0000005f] z-20 h-full top-0 left-0`}
          >
            <div className="fixed w-[70%] bg-[#fff] h-screen top-0 left-0 z-10 overflow-y-scroll">
              <div className="w-full justify-between flex pr-3">
                <div>
                  <div
                    className="relative mr-[15px]"
                    onClick={() => setOpenWishlist(true) || setOpen(false)}
                  >
                    <AiOutlineHeart size={30} className="mt-5 ml-3" />
                    <span class="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px]  leading-tight text-center">
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
              <div className="w-[140px] h-[40px]  bg-[#4e64df] rounded-xl font-bold top-[392px] left-[36px] absolute z-10">
            <Link to={`${isSeller ? "/dashboard" : "/shop-create"}`}>
              <h1 className="relative text-[#fff] flex items-center justify-center top-2   ">
                {isSeller ? "Go Dashboard" : " Artist SignUp"}{" "}
                <FiArrowRight className="ml-1" />
              </h1>
            </Link>
          </div>
              <br />
              <br />
              <br />

              <div className="flex w-full justify-center absolute top-[500px] right-[50px]">
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
    </>
  );
};

export default Header;
