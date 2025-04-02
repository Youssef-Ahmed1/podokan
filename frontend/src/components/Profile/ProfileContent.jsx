// frontend/src/components/Profile/ProfileContent.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AiOutlineCamera, AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { server } from "../../server";
import { DataGrid } from "@mui/x-data-grid";
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
  Box,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
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
import Loader from "../Layout/Loader";
import { format } from "date-fns";

// --- Profile Info Sub-Component ---
const ProfileInfo = () => {
  const { user, loading, error, successMessage } = useSelector(
    (state) => state.user
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
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
      dispatch({ type: "clearMessages" });
      setPassword("");
    } // Clear success and password
  }, [user, error, successMessage, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserInformation(name, email, phoneNumber, password));
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarLoading(true);
    try {
      await axios.put(`${server}/user/update-avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      dispatch(loadUser());
      toast.success("Avatar updated!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Avatar update failed");
      setAvatar(null);
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: 3,
        py: 4,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          maxWidth: "sm",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ position: "relative", mb: 2 }}>
          <img
            src={
              avatar
                ? URL.createObjectURL(avatar)
                : user?.avatar?.url || "/default-avatar.png"
            }
            className="w-[150px] h-[150px] rounded-full object-cover border-4 border-green-500"
            alt="avatar"
          />
          <IconButton
            component="label"
            htmlFor="avatar-input"
            size="small"
            sx={{
              position: "absolute",
              bottom: 5,
              right: 5,
              bgcolor: "background.paper",
              "&:hover": { bgcolor: "grey.200" },
              border: "1px solid grey.300",
            }}
            disabled={avatarLoading}
          >
            {avatarLoading ? <Loader size={20} /> : <AiOutlineCamera />}{" "}
            <input
              type="file"
              id="avatar-input"
              hidden
              accept=".jpg,.jpeg,.png"
              onChange={handleImage}
            />
          </IconButton>
        </Box>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            mt: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Phone Number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Current Password to Update"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            size="small"
            helperText="Required to save changes"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 1, py: 1.2 }}
          >
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </Box>
      </Box>
    </Box>
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

  const columns = useMemo(
    () => [
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
        type: "date",
        valueGetter: (value) => (value ? new Date(value) : null),
        valueFormatter: (v) => (v ? format(v, "PP") : ""),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 100,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => (
          <IconButton
            component={Link}
            to={`/user/order/${p.id}`}
            size="small"
            title="View"
          >
            <AiOutlineEye className="text-blue-600" />
          </IconButton>
        ),
      },
    ],
    []
  );

  const rows = useMemo(
    () =>
      orders?.map((i) => ({
        id: i._id,
        itemsQty: i.cart?.length || 0,
        total: i.totalPrice,
        status: i.status,
        orderDate: i.createdAt,
      })) || [],
    [orders]
  );

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-4">My Orders</h2>
      <div
        className="w-full bg-white rounded shadow-sm"
        style={{ height: 500 }}
      >
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
    () => orders?.filter((i) => i.status?.includes("Refund")) || [],
    [orders]
  );

  const columns = useMemo(
    () => [
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
        type: "date",
        valueGetter: (v) => (v ? new Date(v) : null),
        valueFormatter: (v) => (v ? format(v, "PP") : ""),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 100,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => (
          <IconButton
            component={Link}
            to={`/user/order/${p.id}`}
            size="small"
            title="View"
          >
            <AiOutlineEye className="text-blue-600" />
          </IconButton>
        ),
      },
    ],
    []
  );

  const rows = useMemo(
    () =>
      refundOrders.map((i) => ({
        id: i._id,
        itemsQty: i.cart?.length || 0,
        total: i.totalPrice,
        status: i.status,
        orderDate: i.createdAt,
      })),
    [refundOrders]
  );

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-4">Refund Requests</h2>
      <div
        className="w-full bg-white rounded shadow-sm"
        style={{ height: 500 }}
      >
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

  const columns = useMemo(
    () => [
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
        type: "date",
        valueGetter: (v) => (v ? new Date(v) : null),
        valueFormatter: (v) => (v ? format(v, "PP") : ""),
      },
      {
        field: "actions",
        headerName: "Track",
        width: 100,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => (
          <IconButton
            component={Link}
            to={`/user/track/order/${p.id}`}
            size="small"
            title="Track"
          >
            <MdTrackChanges className="text-blue-600" />
          </IconButton>
        ),
      },
    ],
    []
  );

  const rows = useMemo(
    () =>
      orders?.map((i) => ({
        id: i._id,
        itemsQty: i.cart?.length || 0,
        total: i.totalPrice,
        status: i.status,
        orderDate: i.createdAt,
      })) || [],
    [orders]
  );

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-4">Track Your Orders</h2>
      <div
        className="w-full bg-white rounded shadow-sm"
        style={{ height: 500 }}
      >
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
  const [loading, setLoading] = useState(false);

  const passwordChangeHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `${server}/user/update-user-password`,
        { oldPassword, newPassword, confirmPassword },
        { withCredentials: true }
      );
      toast.success("Password updated!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-5 py-5">
      <h1 className="text-xl text-center font-semibold mb-6">
        Change Password
      </h1>
      <Box
        component="form"
        onSubmit={passwordChangeHandler}
        sx={{
          maxWidth: "sm",
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <TextField
          label="Old Password"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
          size="small"
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ mt: 1, py: 1.2 }}
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </Box>
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
  const { user, addressLoading, error, successMessage } = useSelector(
    (state) => state.user
  );
  const dispatch = useDispatch();

  const addressTypes = ["Default", "Home", "Office"];

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUserErrors());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch({ type: "clearMessages" });
    }
  }, [error, successMessage, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!addressType || !country || !address1) {
      toast.error("Fill required fields!");
      return;
    }
    dispatch(
      updateUserAddress(country, city, address1, address2, zipCode, addressType)
    );
    setOpen(false);
    resetForm();
  };
  const handleDelete = (item) => {
    if (!window.confirm("Delete address?")) return;
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
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          Add New
        </Button>
      </div>
      {user?.addresses?.length > 0 ? (
        user.addresses.map((item) => (
          <div
            className="w-full bg-white rounded-md shadow-sm flex items-center justify-between p-3 pr-6 mb-3"
            key={item._id}
          >
            <div className="flex items-center">
              <h5 className="font-semibold text-sm md:text-base">
                {item.addressType}
              </h5>
            </div>
            <div className="pl-4 text-sm md:text-base text-gray-700 flex-grow">
              {item.address1}, {item.address2 ? `${item.address2}, ` : ""}{" "}
              {item.city ? `${item.city}, ` : ""} {item.country || ""}{" "}
              {item.zipCode || ""}
            </div>
            <div className="pl-4">
              <IconButton
                onClick={() => handleDelete(item)}
                size="small"
                title="Delete"
              >
                <AiOutlineDelete className="cursor-pointer text-red-500" />
              </IconButton>
            </div>
          </div>
        ))
      ) : (
        <Typography textAlign="center" pt={4} color="text.secondary">
          No saved addresses.
        </Typography>
      )}
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
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent
            dividers
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <FormControl fullWidth size="small" required>
              <InputLabel>Country</InputLabel>
              <Select
                value={country}
                label="Country"
                onChange={(e) => setCountry(e.target.value)}
              >
                {Country?.getAllCountries().map((c) => (
                  <MenuItem key={c.isoCode} value={c.isoCode}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" disabled={!country}>
              <InputLabel>City/State</InputLabel>
              <Select
                value={city}
                label="City/State"
                onChange={(e) => setCity(e.target.value)}
              >
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
              size="small"
            />
            <TextField
              label="Address Line 2 (Optional)"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Zip/Postal Code (Optional)"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              fullWidth
              size="small"
            />
            <FormControl fullWidth size="small" required>
              <InputLabel>Address Type</InputLabel>
              <Select
                value={addressType}
                label="Address Type"
                onChange={(e) => setAddressType(e.target.value)}
              >
                {addressTypes.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addressLoading}>
              {addressLoading ? "Saving..." : "Save Address"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </div>
  );
};

// --- Main Profile Content Tabs ---
const ProfileContent = ({ active }) => {
  const [value, setValue] = useState(active - 1); // MUI Tabs are 0-indexed

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Map tab index to component
  const renderContent = (index) => {
    switch (index) {
      case 0:
        return <ProfileInfo />;
      case 1:
        return <AllOrders />;
      case 2:
        return <AllRefundOrders />;
      case 3:
        return <TrackOrder />; // Index adjusted (original was 5)
      case 4:
        return <ChangePassword />; // Index adjusted (original was 6)
      case 5:
        return <Address />; // Index adjusted (original was 7)
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          borderRadius: 1,
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Profile Tabs"
        >
          <Tab label="Profile" />
          <Tab label="Orders" />
          <Tab label="Refunds" />
          <Tab label="Track Order" />
          <Tab label="Change Password" />
          <Tab label="Addresses" />
        </Tabs>
      </Box>
      <Box sx={{ mt: 3 }}>{renderContent(value)}</Box>
    </Box>
  );
};

export default ProfileContent;