import React from 'react';
import { Link } from 'react-router-dom';
import { categoriesData } from '../../static/data';

const Navbar = ({ active }) => {
  return (
    <div className="flex items-center justify-between w-full">
      <Link 
        to="/all-designs" 
        className={`text-white hover:text-[#f6b92e] transition-colors duration-300 ${
          active === "All" ? "text-[#f6b92e]" : ""
        }`}
      >
        Shop All Designs
      </Link>
      {categoriesData.map((category) => (
        <Link 
          key={category.id} 
          to={`/category/${category.title.toLowerCase()}`} 
          className={`flex items-center text-white hover:text-[#f6b92e] transition-colors duration-300 ${
            active === category.title ? "text-[#f6b92e]" : ""
          }`}
        >
          <img src={category.icon} alt={category.title} className="w-5 h-5 mr-1" />
          {category.title}
        </Link>
      ))}
    </div>
  );
};

export default Navbar;