import React from "react";
import styles from "../../styles/styles";
import { usePayment } from "./usePayment.js"; // Import the brain!

const Payment = () => {
    // Plug the brain into the UI
    const { orderData, select, setSelect, cashOnDeliveryHandler } =
        usePayment();

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
                        <form
                            className="w-full"
                            onSubmit={cashOnDeliveryHandler}
                        >
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
};;

export default Payment;
