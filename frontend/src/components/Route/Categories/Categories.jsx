import React from "react";
import { useNavigate } from "react-router-dom";
import { categoriesData } from "../../../static/data";
import styles from "../../../styles/styles";

const Categories = () => {
  const navigate = useNavigate();

  const handleSubmit = (category) => {
    navigate(`/products?category=${category.title}`);
  };

  return (
    <div className="mb-2 py-4 px-2 sm:px-4 md:px-6" id="categories">
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
        {categoriesData.map((category) => (
          <div
            key={category.id}
            className="w-[80px] sm:w-[100px] md:w-[120px] flex flex-col items-center justify-center cursor-pointer transition duration-300 ease-in-out hover:bg-[#2b2b3b] rounded-lg p-2"
            onClick={() => handleSubmit(category)}
          >
            <img
              src={category.icon}
              className="w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] md:w-[50px] md:h-[50px] object-contain mb-2"
              alt={category.title}
            />
            <span className="text-[12px] sm:text-[14px] md:text-[16px] text-center text-white">
              {category.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;