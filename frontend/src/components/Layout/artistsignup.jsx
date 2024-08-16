import React from 'react'
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

const ArtistSign = () => {
    const { isSeller } = useSelector((state) => state.seller);

  return (
    <div>
<div className="
bg-[#2b2b3b]
left-[280px] 
bottom-[-26px]
 w-[1200px] 
 h-[80px]
  bg-opacity-75
  relative
   rounded-xl
  text-[#fff]
   flex
    items-center 
  justify-left
   "
  
  >   
<span className='font-semibold relative left-48'>Turn your passion into profit.</span>
 <span className='relative left-56'>Sell your art on podokan today!</span>
   </div>

<div className="w-[150px] h-[42px]  bg-[#4e64df] rounded-xl font-medium left-[1070px] bottom-[35px] relative z-10">
       <Link to={`${isSeller ? "/dashboard" : "/shop-create"}`}>
         <h1 className="relative text-[#fff] flex items-center justify-center top-[8px]   ">
           {isSeller ? "Go Dashboard" : " Artist SignUp"}{" "}
           <FiArrowRight className="ml-1" />
         </h1>
       </Link>
     </div>  
     </div>
     
    );
};

export default ArtistSign