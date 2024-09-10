import React, { useEffect, useState } from "react";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getAllProductsShop } from "../../redux/actions/product";
import { server } from "../../server";
import styles from "../../styles/styles";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import { toast } from "react-toastify";
import Ratings from "./Ratings";
import axios from "axios";

const ProductDetails = ({ data }) => {
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const { products } = useSelector((state) => state.products);
  const [count, setCount] = useState(1);
const [click, setClick] = useState(false);
  const [select, setSelect] = useState(0);
  const [selectedColor, setSelectedColor] = useState("black");
  const [fit, setFit] = useState("Male fit");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (data?.shop?._id) {
      dispatch(getAllProductsShop(data.shop._id));
    }

    setClick(wishlist?.some((i) => i._id === data?._id));
  }, [data, dispatch, wishlist]);

  const incrementCount = () => {
    setCount((prevCount) => prevCount + 1);
  };

  const decrementCount = () => {
    setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 1));
  };

  const removeFromWishlistHandler = (data) => {
    setClick(false);
    dispatch(removeFromWishlist(data));
  };

  const addToWishlistHandler = (data) => {
    setClick(true);
    dispatch(addToWishlist(data));
  };

  const addToCartHandler = (id) => {
    const isItemExists = cart && cart.find((i) => i._id === id);
    if (isItemExists) {
      toast.error("Item already in cart!");
    } else {
      if (data.stock < 1) {
        toast.error("Product stock limited!");
      } else {
        const cartData = {
          ...data,
          qty: count,
          color: selectedColor,
          fit,
        };
        dispatch(addTocart(cartData));
        toast.success("Item added to cart successfully!");
      }
    }
  };

  const totalReviewsLength =
    products && products.reduce((acc, product) => acc + product.reviews.length, 0);

  const totalRatings =
    products &&
    products.reduce(
      (acc, product) =>
        acc + product.reviews.reduce((sum, review) => sum + review.rating, 0),
      0
    );

  const averageRating = totalReviewsLength
    ? (totalRatings / totalReviewsLength).toFixed(2)
    : 0;

  const handleMessageSubmit = async () => {
    if (isAuthenticated) {
      const groupTitle = data._id + user._id;
      const userId = user._id;
      const sellerId = data.shop._id;
      try {
        const res = await axios.post(`${server}/conversation/create-new-conversation`, {
          groupTitle,
          userId,
          sellerId,
        });
        navigate(`/inbox?${res.data.conversation._id}`);
      } catch (error) {
        toast.error(error.response.data.message);
      }
    } else {
      toast.error("Please login to create a conversation");
    }
  };

  return (
    <div className="bg-white">
      {data ? (
        <div className={`${styles.section} w-[90%] 800px:w-[80%]`}>
          <div className="w-full py-5">
            <div className="block w-full 800px:flex">
              <div className="w-full 800px:w-[50%]">
                {/* Image slider */}
                <div className="relative">
                  <img
                    src={`${data && data.images[select]?.url}`}
                    alt=""
                    className="w-[80%]"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    {data &&
                      data.images.map((img, index) => (
                        <div
                          key={index}
                          className={`w-4 h-4 rounded-full mx-2 cursor-pointer ${
                            select === index ? "bg-black" : "bg-gray-400"
                          }`}
                          onClick={() => setSelect(index)}
                        ></div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="w-full 800px:w-[50%] pt-5">
                <h1 className={`${styles.productTitle} text-2xl font-bold`}>
                  {data.name}
                </h1>
                <p className="text-lg mt-2">{data.Description}</p>
                <div className="flex items-center mt-4">
                  <div className="flex">
                    {[
                      "black",
                      "white",
                      "red",
                      "blue",
                      "gray",
                      "purple",
                      "yellow",
                      "green",
                      "orange",
                      "brown",
                      "indigo",
                      "violet",
                      "teal",
                      "maroon",
                      "pink",
                    ].map((clr) => (
                      <div
                        key={clr}
                        className={`border-none rounded-full w-5 h-5 mx-1 my-8 cursor-pointer ${
                          selectedColor === clr ? "border-black" : ""
                        }`}
                        style={{ backgroundColor: clr }}
                        onClick={() => setSelectedColor(clr)}
                      >
                        {selectedColor === clr && (
                          <p className="text-black absolute top-[244px] my-3">
                            {clr}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <h4 className="text-lg font-bold mr-2">Fit:</h4>
                  <div className="flex">
                    <button
                      className={`px-[75px] py-2 rounded-xl mr-2
                       hover:bg-gray-400
                       active:bg-gray-500 
                        focus:outline-black focus:ring
                         focus:ring-gray-300 ${
                           fit === "Male fit"
                             ? "bg-black text-white"
                             : "bg-gray-200 text-black"
                         }`}
                      onClick={() => setFit("Male fit")}
                    >
                      Male fit
                    </button>
                    <button
                      className={`px-[75px] py-2 rounded-xl mr-2
                       hover:bg-gray-400
                       active:bg-gray-500
                         focus:outline-black 
                         focus:ring
                          focus:ring-gray-300 ${
                            fit === "Female fit"
                              ? "bg-black text-white"
                              : "bg-gray-200 text-black"
                          }`}
                      onClick={() => setFit("Female fit")}
                    >
                      Female fit
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-8">
                  <h4 className="text-2xl font-bold">${data.discountPrice}</h4>
                  {data.originalPrice && (
                    <h3 className="text-3xl line-through text-red-500 font-bold absolute left-[900px] top-[440px]">
                      ${data.originalPrice}
                    </h3>
                  )}
                </div>
                <div className="flex items-center mt-8">
                  <div className="flex items-center border border-gray-400 rounded-md px-4 py-2">
                    <button
                      className="text-xl font-bold mr-4"
                      onClick={decrementCount}
                    >
                      -
                    </button>
                    <span className="text-lg">{count}</span>
                    <button
                      className="text-xl font-bold ml-4"
                      onClick={incrementCount}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className={`${styles.button} ml-8 text-white`}
                    onClick={() => addToCartHandler(data._id)}
                  >
                    Add to Cart <AiOutlineShoppingCart className="ml-2" />
                  </button>
                </div>
                <div className="flex items-center mt-8">
                  {click ? (
                    <AiFillHeart
                      size={30}
                      className="cursor-pointer"
                      onClick={() => removeFromWishlistHandler(data)}
                      color={click ? "red" : "#333"}
                      title="Remove from wishlist"
                    />
                  ) : (
                    <AiOutlineHeart
                      size={30}
                      className="cursor-pointer"
                      onClick={() => addToWishlistHandler(data)}
                      color={click ? "red" : "#333"}
                      title="Add to wishlist"
                    />
                  )}
                  <button
                    className={`${styles.button} ml-4 text-gray-300`}
                    onClick={handleMessageSubmit}
                  >
                    Send Message <AiOutlineMessage className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <ProductDetailsInfo
            data={data}
            products={products}
            totalReviewsLength={totalReviewsLength}
            averageRating={averageRating}
          />
        </div>
      ) : null}
    </div>
  );
};

const ProductDetailsInfo = ({
  data,
  products,
  totalReviewsLength,
  averageRating,
}) => {
  const [active, setActive] = useState(1);

  return (
    <div className="bg-[#f5f6fb] px-3 800px:px-10 py-2 rounded">
      <div className="w-full flex justify-between border-b pt-10 pb-2">
        <div className="relative">
          <h5
            className={
              "text-[#000] text-[18px] px-1 leading-5 font-[600] cursor-pointer 800px:text-[20px]"
            }
            onClick={() => setActive(1)}
          >
            Product Details
          </h5>
          {active === 1 ? (
            <div className={`${styles.active_indicator}`} />
          ) : null}
        </div>
        <div className="relative">
          <h5
            className={
              "text-[#000] text-[18px] px-1 leading-5 font-[600] cursor-pointer 800px:text-[20px]"
            }
            onClick={() => setActive(2)}
          >
            Product Reviews
          </h5>
          {active === 2 ? (
            <div className={`${styles.active_indicator}`} />
          ) : null}
        </div>
        <div className="relative">
          <h5
            className={
              "text-[#000] text-[18px] px-1 leading-5 font-[600] cursor-pointer 800px:text-[20px]"
            }
            onClick={() => setActive(3)}
          >
            Seller Information
          </h5>
          {active === 3 ? (
            <div className={`${styles.active_indicator}`} />
          ) : null}
        </div>
      </div>
      {active === 1 ? (
        <>
          <p className="py-2 text-[18px] leading-8 pb-10 whitespace-pre-line">
            {data.Description}
          </p>
        </>
      ) : null}

      {active === 2 ? (
        <div className="w-full min-h-[40vh] flex flex-col items-center py-3 overflow-y-scroll">
          {data &&
            data.reviews.map((item, index) => (
              <div key={index} className="w-full flex my-2">
                <img
                  src={`${item.user.avatar?.url}`}
                  alt=""
                  className="w-[50px] h-[50px] rounded-full"
                />
                <div className="pl-2">
                  <div className="w-full flex items-center">
                    <h1 className="font-[500] mr-3">{item.user.name}</h1>
                    <Ratings rating={item.rating} />
                  </div>
                  <p>{item.comment}</p>
                </div>
              </div>
            ))}

          <div className="w-full flex justify-center">
            {data && data.reviews.length === 0 && (
              <h5>No Reviews have been submitted for this product!</h5>
            )}
          </div>
        </div>
      ) : null}

      {active === 3 && (
        <div className="w-full block 800px:flex p-5">
          <div className="w-full 800px:w-[50%]">
            <Link to={`/shop/preview/${data.shop._id}`}>
              <div className="flex items-center">
                <img
                  src={`${data?.shop?.avatar?.url}`}
                  className="w-[50px] h-[50px] rounded-full"
                  alt=""
                />
                <div className="pl-3">
                  <h3 className={`${styles.shop_name}`}>{data.shop.name}</h3>
                  <h5 className="pb-2 text-[15px]">
                    ({averageRating}/5) Ratings
                  </h5>
                </div>
              </div>
            </Link>
            <p className="pt-2">{data.shop.Description}</p>
          </div>
          <div className="w-full 800px:w-[50%] mt-5 800px:mt-0 800px:flex flex-col items-end">
            <div className="text-left">
              <h5 className="font-[600]">
                Joined on:{" "}
                <span className="font-[500]">
                  {data.shop?.createdAt?.slice(0, 10)}
                </span>
              </h5>
              <h5 className="font-[600] pt-3">
                Total Products:{" "}
                <span className="font-[500]">
                  {products && products.length}
                </span>
              </h5>
              <h5 className="font-[600] pt-3">
                Total Reviews:{" "}
                <span className="font-[500]">{totalReviewsLength}</span>
              </h5>
              <Link to="/">
                <div
                  className={`${styles.button} !rounded-[4px] !h-[39.5px] mt-3`}
                >
                  <h4 className="text-white">Visit Shop</h4>
</div>
</Link>
</div>
</div>
</div>
)}
</div>
);
};

export default ProductDetails;