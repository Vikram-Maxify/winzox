import {
  BadgeCheck,
  Calendar,
  Copy,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearError,
  clearMessage,
  getProfile,
  updateProfile,
} from "../redux/slices/authSlice";

// Helper function to get currency symbol based on country
const getCurrencySymbol = (country) => {
  const symbols = {
    'IN': '₹',
    'US': '$',
    'GB': '£',
    'EU': '€',
    'JP': '¥',
    'CN': '¥',
    'AU': '$',
    'CA': '$',
    'default': '₹'
  };
  return symbols[country] || symbols.default;
};

export default function ProfileContent({ formatCurrency: propFormatCurrency, currencySymbol: propCurrencySymbol }) {
  const dispatch = useDispatch();
  const { user, loading, error, profileLoaded } = useSelector(
    (state) => state.auth,
  );

  // Use props if provided, otherwise calculate from user
  const currencySymbol = propCurrencySymbol || getCurrencySymbol(user?.country);
  
  // Format currency function
  const formatCurrency = propFormatCurrency || ((amount) => {
    return `${currencySymbol}${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  });

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    referralCode: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [updateStatus, setUpdateStatus] = useState(null);

  useEffect(() => {
    if (!profileLoaded && !loading) {
      dispatch(getProfile());
    }
  }, [dispatch, profileLoaded, loading]);

  useEffect(() => {
    if (user && !loading) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        referralCode: user.referralCode || "",
      });
    }
  }, [user, loading]);

  const calculateAccountAge = () => {
    if (!user?.createdAt) return "N/A";
    const createdDate = new Date(user.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Days`;
  };

  const stats = [
    {
      title: "Available Balance",
      value: formatCurrency(user?.balance?.local || 0),
      icon: IndianRupee,
      color: "text-amber-500",
    },
    {
      title: "Wallet Balance",
      value: formatCurrency(user?.balance?.local || 0),
      icon: Wallet,
      color: "text-green-600",
    },
    {
      title: "Referral Earnings",
      value: formatCurrency(user?.referralEarning || 0),
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Referrals",
      value: user?.totalReferrals || 0,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Account Age",
      value: calculateAccountAge(),
      icon: Calendar,
      color: "text-pink-600",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) dispatch(clearError());
    setUpdateStatus(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!profile.name.trim()) errors.name = "Full name is required";
    else if (profile.name.trim().length < 2)
      errors.name = "Name must be at least 2 characters";
    if (!profile.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
      errors.email = "Please enter a valid email address";
    if (!profile.mobile.trim()) errors.mobile = "Mobile number is required";
    else if (!/^[0-9]{10}$/.test(profile.mobile.replace(/\D/g, "")))
      errors.mobile = "Please enter a valid 10-digit mobile number";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsEditing(true);
    setUpdateStatus(null);
    try {
      const updateData = {
        name: profile.name,
        email: profile.email,
        mobile: profile.mobile,
      };
      await dispatch(updateProfile(updateData)).unwrap();
      setUpdateStatus({
        type: "success",
        message: "Profile updated successfully!",
      });
      dispatch(clearMessage());
      await dispatch(getProfile());
    } catch (err) {
      setUpdateStatus({
        type: "error",
        message: err || "Failed to update profile",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleReset = () => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        referralCode: user.referralCode || "",
      });
    }
    setFormErrors({});
    setUpdateStatus(null);
    if (error) dispatch(clearError());
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(profile.referralCode);
    setUpdateStatus({
      type: "success",
      message: "Referral code copied to clipboard!",
    });
    setTimeout(() => setUpdateStatus(null), 3000);
  };

  if (loading && !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2
            className="animate-spin text-amber-500 mx-auto mb-4"
            size={48}
          />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=ffffff&color=amber&size=128`
                }
                alt="Profile"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                {user?.name || "User"}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm truncate">
                @{user?._id?.slice(-8) || "N/A"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <BadgeCheck size={14} className="text-white flex-shrink-0" />
                <span className="text-white/90 text-xs sm:text-sm font-medium">
                  Active
                </span>
                <span className="text-white/90 text-xs sm:text-sm font-medium">
                  •
                </span>
                <span className="text-white/90 text-xs sm:text-sm font-medium">
                  Silver Member
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5 sm:p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Icon className={item.color} size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-[10px] sm:text-xs truncate">
                      {item.title}
                    </p>
                    <h2
                      className={`text-xs sm:text-sm font-bold ${item.color} truncate`}
                    >
                      {item.value}
                    </h2>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Personal Information */}
        <div className="mt-3 sm:mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 sm:py-4 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">
              Personal Information
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm">
              Update your account information.
            </p>
          </div>
          <div className="p-4 sm:p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm">
                {error}
              </div>
            )}
            {updateStatus?.type === "success" && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-xs sm:text-sm">
                {updateStatus.message}
              </div>
            )}
            {updateStatus?.type === "error" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm">
                {updateStatus.message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="font-semibold text-gray-700 text-xs sm:text-sm">
                  Full Name *
                </label>
                <div className="relative mt-1">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className={`w-full h-10 rounded-xl border ${formErrors.name ? "border-red-400" : "border-gray-300"} pl-9 pr-3 bg-gray-50 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none text-sm`}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700 text-xs sm:text-sm">
                  Email Address *
                </label>
                <div className="relative mt-1">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    className={`w-full h-10 rounded-xl border ${formErrors.email ? "border-red-400" : "border-gray-300"} pl-9 pr-3 bg-gray-50 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none text-sm`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700 text-xs sm:text-sm">
                  Mobile Number *
                </label>
                <div className="relative mt-1">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    name="mobile"
                    value={profile.mobile}
                    onChange={handleChange}
                    className={`w-full h-10 rounded-xl border ${formErrors.mobile ? "border-red-400" : "border-gray-300"} pl-9 pr-3 bg-gray-50 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none text-sm`}
                  />
                </div>
                {formErrors.mobile && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.mobile}
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700 text-xs sm:text-sm">
                  City
                </label>
                <div className="relative mt-1">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    name="city"
                    value={user?.city || ""}
                    onChange={handleChange}
                    className="w-full h-10 rounded-xl border border-gray-300 pl-9 pr-3 bg-gray-50 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none text-sm"
                    placeholder="Enter your city"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 text-xs sm:text-sm">
                  Referral Code
                </label>
                <div className="relative mt-1">
                  <input
                    readOnly
                    value={profile.referralCode}
                    className="w-full h-10 rounded-xl border border-gray-300 bg-gray-100 px-3 pr-12 uppercase font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCopyReferral}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-600 transition-colors"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="w-full h-10 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition text-sm"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isEditing}
                className={`w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg transition text-sm ${
                  isEditing
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:scale-[1.02]"
                }`}
              >
                {isEditing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} /> Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}