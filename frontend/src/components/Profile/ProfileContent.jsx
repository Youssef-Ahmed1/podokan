// frontend/src/components/Profile/ProfileContent.jsx
import React, { useState, useEffect, useCallback } from "react";
import { AiOutlineCamera, AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { server } from "../../server";
import { DataGrid } from "@mui/x-data-grid"; // Changed import
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material"; // Changed imports
import { Link } from "react-router-dom";
import { MdTrackChanges } from "react-icons/md";
import { RxCross1 } from "react-icons/rx";
import {
  deleteUserAddress,
  loadUser,
  updateUserAddress,
  updateUserInformation,
  clearErrors as clearUserErrors,
} from "../../redux/actions/user";
import { Country, State } from "country-state-city";
import { toast } from "react-toastify";
import axios from "axios";
import {
  getAllOrdersOfUser,
  clearErrors as clearOrderErrors,
} from "../../redux/actions/order";
import styles from "../../styles/styles"; // Keep if used for non-MUI styles
import Loader from "../Layout/Loader"; // Assuming Loader exists

// --- Profile Info Sub-Component ---
const ProfileInfo = () => {
  const { user, error, successMessage } = useSelector((state) => state.user); // Add error/success selectors
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null); // For file upload
  const dispatch = useDispatch();

  useEffect(() => {
    // Reset form on user change (e.g., after update)
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhoneNumber(user.phoneNumber || "");
    }
    if (error) {
      toast.error(error);
      dispatch(clearUserErrors());
    }
    if (successMessage) {
      toast.success(successMessage);
      // Clear success message in reducer if needed: dispatch({ type: 'ClearSuccess' });
      setPassword(""); // Clear password field after successful update
    }
  }, [user, error, successMessage, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserInformation(name, email, phoneNumber, password));
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file); // Store file object

    const formData = new FormData();
    formData.append("avatar", file); // Use 'avatar' as key expected by backend

    try {
      // Assuming endpoint exists and returns updated user
      const { data } = await axios.put(
        `${server}/user/update-avatar`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      // Reload user data after successful avatar update
      dispatch(loadUser());
      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Avatar update failed");
      setAvatar(null); // Reset avatar state on error
    }
  };

  return (
    <div className="w-full px-5 py-5">
      <div className="flex flex-col items-center w-full">
        <div className="relative mb-4">
          <img
            src={
              avatar
                ? URL.createObjectURL(avatar)
                : user?.avatar?.url || "/default-avatar.png"
            }
            className="w-[150px] h-[150px] rounded-full object-cover border-[3px] border-[#3ad132]"
            alt="avatar"
          />
          <label
            htmlFor="avatar-input"
            className="w-[35px] h-[35px] bg-[#E3E9EE] rounded-full flex items-center justify-center cursor-pointer absolute bottom-[5px] right-[5px] border hover:bg-gray-200"
          >
            <AiOutlineCamera size={20} />
            <input
              type="file"
              id="avatar-input"
              accept=".jpg,.jpeg,.png"
              onChange={handleImage}
              className="sr-only"
            />
          </label>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg mt-4 space-y-4"
        >
          <TextField
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            variant="outlined"
            size="small"
          />
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            variant="outlined"
            size="small"
          />
          <TextField
            label="Phone Number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          />
          <TextField
            label="Enter Current Password to Update"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            variant="outlined"
            size="small"
            helperText="Required to save changes"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, py: 1 }}
          >
            Update Profile
          </Button>
        </form>
      </div>
    </div>
  );
};

// --- All Orders Sub-Component ---
const AllOrders = () => {
  const { user } = useSelector((state) => state.user);
  const { orders, isLoading, error } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearOrderErrors());
    }
    if (user?._id) dispatch(getAllOrdersOfUser(user._id));
  }, [dispatch, user?._id, error]);

  const columns = [
    {
      field: "id",
      headerName: "Order ID",
      width: 220,
      renderCell: (p) => `#${p.value}`,
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.value === "Delivered"
              ? "bg-green-100 text-green-800"
              : p.value === "Cancelled"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {p.value}
        </span>
      ),
    },
    {
      field: "itemsQty",
      headerName: "Items",
      type: "number",
      width: 80,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: "Total",
      type: "number",
      width: 130,
      valueFormatter: (v) => `EGP ${Number(v || 0).toFixed(2)}`,
    },
    {
      field: "orderDate",
      headerName: "Date",
      width: 120,
      valueFormatter: (v) => (v ? format(new Date(v), "PP") : ""),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/user/order/${params.id}`}
          size="small"
          title="View Details"
        >
          <AiOutlineEye className="text-blue-600" />
        </IconButton>
      ),
    },
  ];

  const rows =
    orders?.map((item) => ({
      id: item._id,
      itemsQty: item.cart?.length || 0,
      total: item.totalPrice,
      status: item.status,
      orderDate: item.createdAt,
    })) || [];

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-4">My Orders</h2>
      <div className="w-full bg-white rounded" style={{ height: 500 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 20]}
          disableRowSelectionOnClick
          autoHeight={false}
          loading={isLoading}
          sx={{ border: "none" }}
        />
      </div>
    </div>
  );
};

// --- All Refund Orders Sub-Component ---
const AllRefundOrders = () => {
  const { user } = useSelector((state) => state.user);
  const { orders, isLoading, error } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearOrderErrors());
    }
    if (user?._id) dispatch(getAllOrdersOfUser(user._id));
  }, [dispatch, user?._id, error]);

  const refundOrders = useMemo(
    () => orders?.filter((item) => item.status?.includes("Refund")) || [],
    [orders]
  );

  const columns = [
    {
      field: "id",
      headerName: "Order ID",
      width: 220,
      renderCell: (p) => `#${p.value}`,
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.value === "Refund Success"
              ? "bg-green-100 text-green-800"
              : p.value === "Refund Rejected"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {p.value}
        </span>
      ),
    },
    {
      field: "itemsQty",
      headerName: "Items",
      type: "number",
      width: 80,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: "Total",
      type: "number",
      width: 130,
      valueFormatter: (v) => `EGP ${Number(v || 0).toFixed(2)}`,
    },
    {
      field: "orderDate",
      headerName: "Date",
      width: 120,
      valueFormatter: (v) => (v ? format(new Date(v), "PP") : ""),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/user/order/${params.id}`}
          size="small"
          title="View Details"
        >
          <AiOutlineEye className="text-blue-600" />
        </IconButton>
      ),
    },
  ];

  const rows = refundOrders.map((item) => ({
    id: item._id,
    itemsQty: item.cart?.length || 0,
    total: item.totalPrice,
    status: item.status,
    orderDate: item.createdAt,
  }));

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-4">Refund Requests</h2>
      <div className="w-full bg-white rounded" style={{ height: 500 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 20]}
          disableRowSelectionOnClick
          autoHeight={false}
          loading={isLoading}
          sx={{ border: "none" }}
        />
      </div>
    </div>
  );
};

// --- Track Order Sub-Component ---
const TrackOrder = () => {
  const { user } = useSelector((state) => state.user);
  const { orders, isLoading, error } = useSelector((state) => state.order);
  const dispatch = useDispatch();

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearOrderErrors());
    }
    if (user?._id) dispatch(getAllOrdersOfUser(user._id));
  }, [dispatch, user?._id, error]);

  const columns = [
    {
      field: "id",
      headerName: "Order ID",
      width: 220,
      renderCell: (p) => `#${p.value}`,
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.value === "Delivered"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {p.value}
        </span>
      ),
    },
    {
      field: "itemsQty",
      headerName: "Items",
      type: "number",
      width: 80,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: "Total",
      type: "number",
      width: 130,
      valueFormatter: (v) => `EGP ${Number(v || 0).toFixed(2)}`,
    },
    {
      field: "orderDate",
      headerName: "Date",
      width: 120,
      valueFormatter: (v) => (v ? format(new Date(v), "PP") : ""),
    },
    {
      field: "actions",
      headerName: "Track",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/user/track/order/${params.id}`}
          size="small"
          title="Track Order"
        >
          <MdTrackChanges className="text-blue-600" />
        </IconButton>
      ),
    },
  ];

  const rows =
    orders?.map((item) => ({
      id: item._id,
      itemsQty: item.cart?.length || 0,
      total: item.totalPrice,
      status: item.status,
      orderDate: item.createdAt,
    })) || [];

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-4">Track Your Orders</h2>
      <div className="w-full bg-white rounded" style={{ height: 500 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 20]}
          disableRowSelectionOnClick
          autoHeight={false}
          loading={isLoading}
          sx={{ border: "none" }}
        />
      </div>
    </div>
  );
};

// --- Change Password Sub-Component ---
const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false); // Local loading state

  const passwordChangeHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `${server}/user/update-user-password`,
        { oldPassword, newPassword, confirmPassword },
        { withCredentials: true }
      );
      toast.success("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-5 py-5">
      <h1 className="text-xl text-center font-semibold mb-6">
        Change Password
      </h1>
      <form
        onSubmit={passwordChangeHandler}
        className="max-w-md mx-auto space-y-4"
      >
        <TextField
          label="Old Password"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          fullWidth
          variant="outlined"
          size="small"
        />
        <TextField
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          fullWidth
          variant="outlined"
          size="small"
        />
        <TextField
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
          variant="outlined"
          size="small"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          sx={{ mt: 2, py: 1.5 }}
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
};

// --- Address Sub-Component ---
const Address = () => {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [addressType, setAddressType] = useState("");
  const { user, error, successMessage } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const addressTypeData = ["Default", "Home", "Office"]; // Simplified

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUserErrors());
    }
    if (successMessage) {
      toast.success(successMessage); /* dispatch clear success */
    }
  }, [error, successMessage, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!addressType || !country || !address1) {
      toast.error("Please fill required address fields!");
      return;
    }
    dispatch(
      updateUserAddress(country, city, address1, address2, zipCode, addressType)
    );
    setOpen(false);
    resetForm();
  };

  const handleDelete = (item) => {
    if (!window.confirm("Delete this address?")) return;
    dispatch(deleteUserAddress(item._id));
  };

  const resetForm = () => {
    setCountry("");
    setCity("");
    setAddress1("");
    setAddress2("");
    setZipCode("");
    setAddressType("");
  };

  return (
    <div className="w-full px-5 py-5">
      <div className="flex w-full items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My Addresses</h1>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          Add New
        </Button>
      </div>

      {user?.addresses?.length > 0 ? (
        user.addresses.map((item, index) => (
          <div
            className="w-full bg-white rounded-md shadow-sm flex items-center justify-between p-3 pr-6 mb-3"
            key={item._id || index}
          >
            <div className="flex items-center">
              <h5 className="font-semibold text-sm md:text-base">
                {item.addressType}
              </h5>
            </div>
            <div className="pl-4 text-sm md:text-base text-gray-700">
              {item.address1}, {item.address2 ? `${item.address2}, ` : ""}{" "}
              {item.city ? `${item.city}, ` : ""} {item.country || ""}{" "}
              {item.zipCode || ""}
            </div>
            <div className="pl-4">
              <IconButton
                onClick={() => handleDelete(item)}
                size="small"
                title="Delete Address"
              >
                <AiOutlineDelete className="cursor-pointer text-red-500" />
              </IconButton>
            </div>
          </div>
        ))
      ) : (
        <h5 className="text-center pt-8 text-gray-500">
          You have no saved addresses.
        </h5>
      )}

      {/* Add Address Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add New Address
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <RxCross1 />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <FormControl fullWidth margin="dense" size="small" required>
              <InputLabel>Country</InputLabel>
              <Select
                value={country}
                label="Country"
                onChange={(e) => setCountry(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select Country</em>
                </MenuItem>
                {Country?.getAllCountries().map((c) => (
                  <MenuItem key={c.isoCode} value={c.isoCode}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl
              fullWidth
              margin="dense"
              size="small"
              disabled={!country}
            >
              <InputLabel>City/State</InputLabel>
              <Select
                value={city}
                label="City/State"
                onChange={(e) => setCity(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select City/State</em>
                </MenuItem>
                {State?.getStatesOfCountry(country).map((s) => (
                  <MenuItem key={s.isoCode} value={s.isoCode}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Address Line 1"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              required
              fullWidth
              margin="dense"
              variant="outlined"
              size="small"
            />
            <TextField
              label="Address Line 2 (Optional)"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              fullWidth
              margin="dense"
              variant="outlined"
              size="small"
            />
            <TextField
              label="Zip/Postal Code (Optional)"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              fullWidth
              margin="dense"
              variant="outlined"
              size="small"
            />
            <FormControl fullWidth margin="dense" size="small" required>
              <InputLabel>Address Type</InputLabel>
              <Select
                value={addressType}
                label="Address Type"
                onChange={(e) => setAddressType(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select Type</em>
                </MenuItem>
                {addressTypeData.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ padding: "16px 24px" }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Save Address
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

// --- Main Profile Content Component ---
const ProfileContent = ({ active }) => {
  return (
    <div className="w-full">
      {active === 1 && <ProfileInfo />}
      {active === 2 && <AllOrders />}
      {active === 3 && <AllRefundOrders />}
      {active === 5 && <TrackOrder />}
      {active === 6 && <ChangePassword />}
      {active === 7 && <Address />}
    </div>
  );
};

export default ProfileContent;
