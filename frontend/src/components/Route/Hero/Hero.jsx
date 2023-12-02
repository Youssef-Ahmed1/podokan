import React from "react";
import { Link } from "react-router-dom";
import styles from "../../../styles/styles";
import bannerImage from "../../../banner.png";

const Hero = () => {
  return (
    <div
    className={`relative  min-h-[84vh] 500px:min-h-[80vh] w-full bg-no-repeat rounded-3xl top-[120px] left-[200px] 
     ${styles.noramlFlex}`} 
    style={{

      backgroundImage: `url(${bannerImage})`, 
    }}
  >
      <div className= {`${styles.section} rounded-[12px] w-[40%] 800px:w-[60%] ` }>
     
     
        <Link to="/products" className="inline-block">
            <div className={`${styles.button} mt-5 relative rounded-3xl left-[338px] top-[-12px] bg-slate-50 text-black  hover:bg-[#4e64df] `}>
                 <span className="text-[#000] font-[Poppins] text-[18px] font-[600]">
                    Shop Now
                 </span>
            </div>
        </Link>
      </div>
    </div>
  );
};

export default Hero;
