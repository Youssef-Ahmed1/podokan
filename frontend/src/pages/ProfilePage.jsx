import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Menu } from "lucide-react";
import Header from "../components/Layout/Header";
import Loader from "../components/Layout/Loader";
import ProfileSideBar from "../components/Profile/ProfileSidebar";
import ProfileContent from "../components/Profile/ProfileContent";

const ProfilePage = () => {
  const { loading } = useSelector((state) => state.user);
  const [active, setActive] = useState(1);
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <Loader />
      ) : (
        <>
          <Header />
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <div className={`
                lg:w-[300px] flex-shrink-0
                fixed lg:relative inset-0 z-40 lg:z-0
                transform lg:transform-none transition-transform duration-200 ease-in-out
                ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                bg-white lg:bg-transparent
                ${showSidebar ? 'backdrop-blur-sm lg:backdrop-blur-none' : ''}
              `}>
                {/* Close button for mobile */}
                {showSidebar && (
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <span className="sr-only">Close menu</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Sidebar Content */}
                <div className="h-full overflow-y-auto py-6 px-4 lg:px-0">
                  <ProfileSideBar 
                    active={active} 
                    setActive={setActive} 
                    onItemClick={() => setShowSidebar(false)}
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-lg shadow">
                  <ProfileContent active={active} />
                </div>
              </div>
            </div>
          </div>

          {/* Backdrop for mobile */}
          {showSidebar && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProfilePage;