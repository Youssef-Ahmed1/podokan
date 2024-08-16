import React from "react";
import { useNavigate } from "react-router-dom";
import { categoriesData } from "../../../static/data";
import styles from "../../../styles/styles";

const Categories = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className={`mb-2 relative bottom-[70px] h-12`} id="categories">
        <div className="flex justify-between items-center mb-8">
          <button className="bg-[#2b2b3b] text-white px-2 py-2 
          rounded-md relative flex justify-center left-24 top-20 border-2
           border-[#4e64df] transition duration-1000 ease-in-out 
           hover:bg-[#4e64df]">Shop All Design
           </button>
          <button
           className="bg-[#2b2b3b]
           text-white px-2 py-2
           rounded-md relative flex justify-center right-24 top-[75px]
            border-2 border-[#4e64df] transition 
            duration-1000 ease-in-out hover:bg-[#4e64df]"
            
            >
              Shop All Product
            </button>
        </div>
        <div className="flex justify-center align-middle md:grid-cols-2 md:gap-[2px] lg:grid-cols-4 lg:gap-[2px] xl: xl:m-0 p-0">
          {categoriesData &&
            categoriesData.map((i) => {
              const handleSubmit = (i) => {
                navigate(`/products?category=${i.title}`);
              };
              return (
                <div
                  className="w-[80px] flex flex-col items-center justify-center cursor-pointer transition duration-1000 ease-in-out hover:bg-[#2b2b3b]"
                  key={i.id}
                  onClick={() => handleSubmit(i)}
                >
                  <img
                    src={i.icon}
                    className="w-[30px] h-[30px] box-border rounded-xl "
                    alt=""
                  />
                  <span className={`text-[14px] leading-[1.3] text-center text-white`}>{i.title}</span>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
};
export default Categories;