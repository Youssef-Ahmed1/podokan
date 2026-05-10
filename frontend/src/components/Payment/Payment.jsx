import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/styles";
import { useSelector } from "react-redux";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

const Payment = () => {
  const [orderData, setOrderData] = useState(null);
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
const [select, setSelect] = useState(3);

  useEffect(() => {
    const orderData = JSON.parse(localStorage.getItem("latestOrder"));
    if (orderData) {
        setOrderData(orderData);
        console.log("Retrieved order data:", orderData);
    } else {
        console.error("No order data found");
        toast.error("No order data found. Please go back to checkout.");
        navigate("/checkout");
    }
  }, [navigate]);



  const cashOnDeliveryHandler = async (e) => {
      e.preventDefault();

      if (!orderData?.cart || !orderData?.shippingAddress || !user) {
          toast.error("Required order information is missing");
          return;
      }

      const orderPayload = {
          cart: orderData.cart.map((item) => {
              console.log("Mapping item for payload:", item);
              return {
                  qty: item.qty,
                  shopId: item.shopId,
                  designImage: item.designImage,
                  DesignTitle: item.DesignTitle,
                  ProductType: item.ProductType,
                  ProductColor: item.ProductColor,
                  size: item.size,
                  productId: item.productId,
                  designSpecs: item.designSpecs,
              };
          }),
          shippingAddress: orderData.shippingAddress,
          user: user,
          paymentInfo: {
              id: null,
              status: "Processing",
              type: "Cash On Delivery",
          },
      };

      const config = {
          headers: {
              "Content-Type": "application/json",
          },
          withCredentials: true,
      };

      try {
          console.log("Sending order data:", orderPayload);
          const { data } = await axios.post(
              `${server}/order/create-order`,
              orderPayload,
              config,
          );

          if (data.success) {
              toast.success("Order successful!");
              localStorage.setItem("cartItems", JSON.stringify([]));
              localStorage.setItem("latestOrder", JSON.stringify([]));
              navigate("/order/success");
          }
      } catch (error) {
          console.error("Order creation error:", error.response?.data);
          toast.error(
              error.response?.data?.message ||
                  error.response?.data?.errors?.[0]?.msg ||
                  "Failed to create order",
          );
      }
  };


  return (
      <div className="w-full 800px:w-[95%] bg-[#fff] rounded-md p-5 pb-8">
          <br />
          {/* cash on delivery */}
          <div>
              <div className="flex w-full pb-5 border-b mb-2">
                  <div
                      className="w-[25px] h-[25px] rounded-full bg-transparent border-[3px] border-[#1d1a1ab4] relative flex items-center justify-center"
                      onClick={() => setSelect(3)}
                  >
                      {select === 3 ? (
                          <div className="w-[13px] h-[13px] bg-[#1d1a1acb] rounded-full" />
                      ) : null}
                  </div>
                  <h4 className="text-[18px] pl-2 font-[600] text-[#000000b1]">
                      Cash on Delivery
                  </h4>
              </div>

              {/* cash on delivery */}
              {select === 3 ? (
                  <div className="w-full flex">
                      <form className="w-full" onSubmit={cashOnDeliveryHandler}>
                          <input
                              type="submit"
                              value="Confirm"
                              className={`${styles.button} !bg-[#f63b60] text-[#fff] h-[45px] rounded-[5px] cursor-pointer text-[18px] font-[600]`}
                          />
                      </form>
                  </div>
              ) : null}
          </div>
      </div>
  );
};

export default Payment;
