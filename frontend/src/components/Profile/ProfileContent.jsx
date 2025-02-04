import React, { useState, useEffect } from "react";
import { AiOutlineArrowRight, AiOutlineCamera, AiOutlineDelete } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { server } from "../../server";
import styles from "../../styles/styles";
import { DataGrid } from "@material-ui/data-grid";
import { Button } from "@material-ui/core";
import { Link } from "react-router-dom";
import { MdTrackChanges } from "react-icons/md";
import { RxCross1 } from "react-icons/rx";
import {
  deleteUserAddress,
  loadUser,
  updateUserAddress,
  updateUserInformation,
} from "../../redux/actions/user";
import { Country, State } from "country-state-city";
import { toast } from "react-toastify";
import axios from "axios";
import { getAllOrdersOfUser } from "../../redux/actions/order";

const ProfileContent = ({ active }) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      {active === 1 && <ProfileInfo />}
      {active === 2 && <AllOrders />}
      {active === 3 && <AllRefundOrders />}
      {active === 5 && <TrackOrder />}
      {active === 6 && <ChangePassword />}
      {active === 7 && <Address />}
    </div>
  );
};

const ProfileInfo = () => {
  const { user } = useSelector((state) => state.user);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserInformation(name, email, phoneNumber, password));
  };

  const handleImage = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatar(reader.result);
        axios
          .put(`${server}/user/update-avatar`, { avatar: reader.result }, { withCredentials: true })
          .then(() => {
            dispatch(loadUser());
            toast.success("Avatar updated successfully!");
          })
          .catch((error) => {
            toast.error(error.response?.data?.message || "Error updating avatar");
          });
      }
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6">
      {/* Profile Image Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <img
            src={user?.avatar?.url}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-100"
          />
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <AiOutlineCamera size={20} className="text-gray-600" />
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-gray-600 font-medium">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-600 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-600 font-medium">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-600 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-8 w-full md:w-auto px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
};


const AllOrders = () => {
  const { user } = useSelector((state) => state.user);
  const { orders } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllOrdersOfUser(user._id));
  }, [dispatch, user._id]);

  const columns = [
    { 
      field: "id", 
      headerName: "Order ID", 
      minWidth: 200,
      flex: 1,
      renderCell: (params) => (
        <div className="font-medium text-gray-900">{params.value}</div>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      flex: 0.7,
      renderCell: (params) => (
        <div className={`px-3 py-1 rounded-full text-sm font-medium
          ${params.value === "Delivered" 
            ? "bg-green-100 text-green-800"
            : "bg-orange-100 text-orange-800"
          }`}>
          {params.value}
        </div>
      ),
    },
    {
      field: "itemsQty",
      headerName: "Items",
      minWidth: 100,
      flex: 0.5,
      renderCell: (params) => (
        <div className="text-gray-700">{params.value} items</div>
      ),
    },
    {
      field: "total",
      headerName: "Total",
      minWidth: 130,
      flex: 0.8,
      renderCell: (params) => (
        <div className="font-medium text-gray-900">{params.value}</div>
      ),
    },
    {
      field: "action",
      headerName: "Action",
      minWidth: 100,
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <Link 
          to={`/user/order/${params.id}`}
          className="text-purple-600 hover:text-purple-800"
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors">
            <span>View</span>
            <AiOutlineArrowRight size={16} />
          </div>
        </Link>
      ),
    },
  ];

  const rows = orders?.map((order) => ({
    id: order._id,
    itemsQty: order.cart.length,
    total: `EGP ${order.totalPrice.toLocaleString()}`,
    status: order.status,
  })) || [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">My Orders</h2>
      <div className="w-full bg-white rounded-lg overflow-hidden">
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          disableSelectionOnClick
          autoHeight
          className="custom-data-grid" // Add custom styling in your CSS
          components={{
            NoRowsOverlay: () => (
              <div className="flex items-center justify-center h-48 text-gray-500">
                No orders found
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

const AllRefundOrders = () => {
  const { user } = useSelector((state) => state.user);
  const { orders } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllOrdersOfUser(user._id));
  }, [dispatch, user._id]);

  const eligibleOrders = orders?.filter((item) => item.status === "Processing refund") || [];

  const columns = [
    { 
      field: "id", 
      headerName: "Order ID", 
      minWidth: 200,
      flex: 1,
      renderCell: (params) => (
        <div className="font-medium text-gray-900">{params.value}</div>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      flex: 0.7,
      renderCell: (params) => (
        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          {params.value}
        </div>
      ),
    },
    {
      field: "itemsQty",
      headerName: "Items",
      minWidth: 100,
      flex: 0.5,
      renderCell: (params) => (
        <div className="text-gray-700">{params.value} items</div>
      ),
    },
    {
      field: "total",
      headerName: "Total",
      minWidth: 130,
      flex: 0.8,
      renderCell: (params) => (
        <div className="font-medium text-gray-900">{params.value}</div>
      ),
    },
    {
      field: "action",
      headerName: "Action",
      minWidth: 100,
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <Link 
          to={`/user/order/${params.id}`}
          className="text-purple-600 hover:text-purple-800"
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors">
            <span>View</span>
            <AiOutlineArrowRight size={16} />
          </div>
        </Link>
      ),
    },
  ];

  const rows = eligibleOrders.map((order) => ({
    id: order._id,
    itemsQty: order.cart.length,
    total: `EGP ${order.totalPrice.toLocaleString()}`,
    status: order.status,
  }));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Refund Orders</h2>
      <div className="w-full bg-white rounded-lg overflow-hidden">
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          disableSelectionOnClick
          autoHeight
          className="custom-data-grid"
          components={{
            NoRowsOverlay: () => (
              <div className="flex items-center justify-center h-48 text-gray-500">
                No refund orders found
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};


const TrackOrder = () => {
  const { user } = useSelector((state) => state.user);
  const { orders } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllOrdersOfUser(user._id));
  }, [dispatch, user._id]);

  const columns = [
    { 
      field: "id", 
      headerName: "Order ID", 
      minWidth: 200,
      flex: 1,
      renderCell: (params) => (
        <div className="font-medium text-gray-900">{params.value}</div>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      flex: 0.7,
      renderCell: (params) => {
        const statusColors = {
          "Processing": "bg-blue-100 text-blue-800",
          "Shipped": "bg-yellow-100 text-yellow-800",
          "Delivered": "bg-green-100 text-green-800",
          "Cancelled": "bg-red-100 text-red-800",
        };
        return (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[params.value] || "bg-gray-100 text-gray-800"}`}>
            {params.value}
          </div>
        );
      },
    },
    {
      field: "itemsQty",
      headerName: "Items",
      minWidth: 100,
      flex: 0.5,
      renderCell: (params) => (
        <div className="text-gray-700">{params.value} items</div>
      ),
    },
    {
      field: "total",
      headerName: "Total",
      minWidth: 130,
      flex: 0.8,
      renderCell: (params) => (
        <div className="font-medium text-gray-900">{params.value}</div>
      ),
    },
    {
      field: "action",
      headerName: "Track",
      minWidth: 100,
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <Link 
          to={`/user/track/order/${params.id}`}
          className="text-purple-600 hover:text-purple-800"
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors">
            <MdTrackChanges size={20} />
            <span>Track</span>
          </div>
        </Link>
      ),
    },
  ];

  const rows = orders?.map((order) => ({
    id: order._id,
    itemsQty: order.cart.length,
    total: `EGP ${order.totalPrice.toLocaleString()}`,
    status: order.status,
  })) || [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Track Orders</h2>
      <div className="w-full bg-white rounded-lg overflow-hidden">
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          disableSelectionOnClick
          autoHeight
          className="custom-data-grid"
        />
      </div>
    </div>
  );
};

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordChangeHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.put(
        `${server}/user/update-user-password`,
        { oldPassword, newPassword, confirmPassword },
        { withCredentials: true }
      );
      toast.success(res.data.success);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Change Password</h2>
      <form onSubmit={passwordChangeHandler} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium
            ${loading 
              ? "bg-purple-400 cursor-not-allowed" 
              : "bg-purple-600 hover:bg-purple-700"
            } transition-colors`}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

const Address = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    city: "",
    zipCode: "",
    address1: "",
    address2: "",
    addressType: "",
    phoneNumber: "",
    fullName: "",
    email: "",
  });
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const addressTypeData = [
    { name: "Default" },
    { name: "Home" },
    { name: "Office" },
  ];

  const cities = ["Cairo", "Alexandria", "Giza", "New Cairo", "6th of October"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const { city, address1, address2, zipCode, addressType, phoneNumber, fullName, email } = formData;

    if (!addressType || !city || !phoneNumber || !fullName || !email) {
      toast.error("Please fill all required fields!");
      return;
    }

    dispatch(
      updateUserAddress(
        "Egypt",
        city,
        address1,
        address2,
        zipCode,
        addressType,
        phoneNumber,
        fullName,
        email
      )
    );
    setOpen(false);
    setFormData({
      city: "",
      zipCode: "",
      address1: "",
      address2: "",
      addressType: "",
      phoneNumber: "",
      fullName: "",
      email: "",
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">My Addresses</h2>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Add New Address
        </button>
      </div>

      {/* Address List */}
      <div className="space-y-4">
        {user?.addresses?.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {item.addressType}
              </span>
              <div className="text-gray-600">
                {item.address1} {item.address2}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-gray-600">{item.phoneNumber}</div>
              <button
                onClick={() => dispatch(deleteUserAddress(item._id))}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <AiOutlineDelete size={20} />
              </button>
            </div>
          </div>
        ))}

        {(!user?.addresses || user.addresses.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            You don't have any saved addresses
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Add New Address</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <RxCross1 size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Form fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name*
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address*
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number*
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City*
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select City</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1*
                    </label>
                    <input
                      type="text"
                      name="address1"
                      value={formData.address1}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      name="address2"
                      value={formData.address2}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Type*
                    </label>
                    <select
                      name="addressType"
                      value={formData.addressType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Type</option>
                      {addressTypeData.map((type) => (
                        <option key={type.name} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Address
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileContent;