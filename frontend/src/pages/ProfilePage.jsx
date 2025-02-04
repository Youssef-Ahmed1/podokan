import React, { useState } from "react";
import Header from "../components/Layout/Header";
import styles from "../styles/styles";
import Loader from "../components/Layout/Loader";
import ProfileSideBar from "../components/Profile/ProfileSidebar";
import ProfileContent from "../components/Profile/ProfileContent";
import { useSelector } from "react-redux";

const ProfilePage = () => {
  const { loading } = useSelector((state) => state.user);
  const [active, setActive] = useState(1);

  return (
    <div>
      {loading ? (
        <Loader />
      ) : (
        <>
          <Header />
          <div className={`${styles.section} flex bg-[#f5f5f5] py-10`}>
            {/* Mobile helper text */}
            <div className="fixed bottom-20 right-4 lg:hidden">
              <span className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
                Click the menu below to navigate
              </span>
            </div>

            {/* Main content layout */}
            <div className="w-[50px] 800px:w-[335px] sticky 800px:mt-0 mt-[18%]">
              <ProfileSideBar active={active} setActive={setActive} />
            </div>
            <div className="w-full 800px:w-[calc(100%-335px)]">
              <ProfileContent active={active} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;