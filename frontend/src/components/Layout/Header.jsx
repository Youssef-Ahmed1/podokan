import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AiOutlineSearch, AiOutlineShoppingCart, AiOutlineUser } from "react-icons/ai";
import { FiUpload } from "react-icons/fi";
import { BiMenuAltLeft } from "react-icons/bi";
import { useSelector } from "react-redux";
import { categoriesData } from "../../static/data";

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const { cart } = useSelector((state) => state.cart);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="bg-[#1a1a2e] text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {isMobile && (
            <BiMenuAltLeft size={30} className="cursor-pointer" />
          )}
          {!isMobile && (
            <button className="text-xl flex items-center">
              <BiMenuAltLeft size={24} className="mr-2" />
              Shop
            </button>
          )}
          <Link to="/" className="text-2xl font-bold">
            TEEPUBLIC
          </Link>
          <div className="flex-grow mx-4 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Find your favorite content"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 px-4 rounded-full bg-white text-black border-4 border-transparent"
                style={{
                  backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #00c9ff, #92fe9d)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'content-box, border-box',
                }}
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#4e64df] text-white p-2 rounded-full">
                <AiOutlineSearch size={20} />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link to="/profile" className="text-sm flex items-center">
                <AiOutlineUser size={24} className="mr-1" />
                Account
              </Link>
            ) : (
              <Link to="/login" className="text-sm flex items-center">
                <AiOutlineUser size={24} className="mr-1" />
                Login
              </Link>
            )}
            <Link to="/cart" className="relative">
              <AiOutlineShoppingCart size={24} />
              {cart && cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>
            <Link
              to="/upload"
              className="bg-[#4e64df] text-white px-4 py-2 rounded-full text-sm flex items-center"
            >
              <FiUpload className="mr-2" /> Upload Art
            </Link>
          </div>
        </div>
      </div>
      {!isMobile && (
        <nav className="bg-[#2a2a40] py-2">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex space-x-4">
              <Link to="/all-designs" className="text-white hover:text-gray-300">Shop All Designs</Link>
              {categoriesData.slice(0, 8).map((category) => (
                <Link key={category.id} to={`/category/${category.title.toLowerCase()}`} className="text-white hover:text-gray-300">
                  {category.title}
                </Link>
              ))}
            </div>
            <Link to="/all-products" className="text-white hover:text-gray-300">See All Products</Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;