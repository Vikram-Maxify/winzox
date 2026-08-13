import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getMarketById,
  clearCurrentMarket,
} from "../../redux/slices/marketSlice";
import { placeBid, clearBidError } from "../../redux/slices/bidSlice";
import {
  ArrowLeft,
  Info,
  TrendingUp,
  Wallet,
  Shield,
  Clock,
  Sparkles,
  Award,
  Zap,
  Coins,
  ChevronRight,
  Crown,
  AlertCircle,
  Grid,
  Dice1,
  Star,
} from "lucide-react";

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
    'SG': 'S$',
    'MY': 'RM',
    'AE': 'د.إ',
    'SA': '﷼',
    'default': '₹'
  };
  return symbols[country] || symbols.default;
};

const PlaceBid = () => {
  const { marketId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { currentMarket, loading: marketLoading } = useSelector(
    (state) => state.market
  );
  const { user } = useSelector((state) => state.auth);
  const { loading: bidLoading, error, message } = useSelector(
    (state) => state.bid
  );

  const { gameType: autoGameType } = location.state || {};

  // Get currency symbol based on user's country
  const currencySymbol = getCurrencySymbol(user?.country);

  // Format currency function using the currency symbol
  const formatCurrency = (amount) => {
    return `${currencySymbol}${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const [formData, setFormData] = useState({
    number: "",
    bidAmount: "",
    gameType: autoGameType || "",
  });
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [hoveredNumber, setHoveredNumber] = useState(null);

  // Generate number grid (1-99, then 00)
  const numberGrid = [];
  for (let i = 1; i <= 100; i++) {
    if (i === 100) {
      numberGrid.push("00");
    } else {
      numberGrid.push(i.toString());
    }
  }

  useEffect(() => {
    dispatch(getMarketById(marketId));
    return () => {
      dispatch(clearCurrentMarket());
      dispatch(clearBidError());
    };
  }, [dispatch, marketId]);

  useEffect(() => {
    if (autoGameType) {
      setFormData(prev => ({
        ...prev,
        gameType: autoGameType
      }));
    }
  }, [autoGameType]);

  useEffect(() => {
    if (error) {
      setLocalError(error);
      setTimeout(() => {
        setLocalError("");
        dispatch(clearBidError());
      }, 5000);
    }
  }, [error, dispatch]);

  const handleNumberSelect = (num) => {
    setSelectedNumber(num);
    setFormData({
      ...formData,
      number: num,
    });
    setLocalError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setLocalError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccess("");

    if (!formData.gameType) {
      setLocalError("Please select a game type");
      return;
    }
    if (!formData.number.trim()) {
      setLocalError("Please select or enter a number");
      return;
    }
    if (!formData.bidAmount || parseFloat(formData.bidAmount) <= 0) {
      setLocalError("Please enter a valid bid amount");
      return;
    }

    const numberValidation = validateNumber(formData.number.trim(), formData.gameType);
    if (!numberValidation.isValid) {
      setLocalError(numberValidation.message);
      return;
    }

    const bidAmount = parseFloat(formData.bidAmount);
    if (bidAmount < currentMarket?.minBid) {
      setLocalError(`Minimum bid amount is ${currencySymbol}${currentMarket?.minBid}`);
      return;
    }
    if (bidAmount > currentMarket?.maxBid) {
      setLocalError(`Maximum bid amount is ${currencySymbol}${currentMarket?.maxBid}`);
      return;
    }
    if (bidAmount > user?.balance.local) {
      setLocalError(`Insufficient balance. Available: ${formatCurrency(user?.balance.local)}`);
      return;
    }

    const result = await dispatch(
      placeBid({
        marketId,
        gameType: formData.gameType,
        number: formData.number.trim(),
        bidAmount: bidAmount,
      })
    );

    if (result.payload?.success) {
      setSuccess(result.payload.message);
      setShowSuccessAnimation(true);
      setFormData({
        number: "",
        bidAmount: "",
        gameType: "",
      });
      setSelectedNumber(null);
      setTimeout(() => {
        navigate("/matka/bids-history");
      }, 2500);
    }
  };

  const gameTypes = [
    "single",
    "jodi",
    "panna",
    "half-sangam",
    "full-sangam",
    "last-digit",
    "first-digit"
  ];

  const validateNumber = (number, gameType) => {
    const str = String(number).trim();
    const num = parseInt(str);

    switch (gameType) {
      case "single":
        if (str.length !== 1 || isNaN(num) || num < 0 || num > 9) {
          return { isValid: false, message: "Single must be a single digit (0-9)" };
        }
        break;
      case "jodi":
        if (str.length !== 2 || isNaN(num) || num < 0 || num > 99) {
          return { isValid: false, message: "Jodi must be a 2-digit number (00-99)" };
        }
        break;
      case "panna":
        if (str.length !== 3 || isNaN(num) || num < 0 || num > 999) {
          return { isValid: false, message: "Panna must be a 3-digit number (000-999)" };
        }
        break;
      case "half-sangam":
        // Allow 1-digit (0-9) or 3-digit (000-999)
        if (!/^\d{1}$/.test(str) && !/^\d{3}$/.test(str)) {
          return { isValid: false, message: "Half-Sangam must be 1-digit (0-9) or 3-digit (000-999)" };
        }
        if (isNaN(num) || num < 0 || num > 999) {
          return { isValid: false, message: "Half-Sangam must be between 0 and 999" };
        }
        break;
      case "full-sangam":
        if (str.length !== 2 || isNaN(num) || num < 0 || num > 99) {
          return { isValid: false, message: "Full-Sangam must be a 2-digit number (00-99)" };
        }
        break;
      case "last-digit":
        if (str.length !== 2 || isNaN(num) || num < 0 || num > 99) {
          return { isValid: false, message: "Last Digit must be a 2-digit number (00-99)" };
        }
        break;
      case "first-digit":
        if (str.length !== 2 || isNaN(num) || num < 0 || num > 99) {
          return { isValid: false, message: "First Digit must be a 2-digit number (00-99)" };
        }
        break;
      default:
        return { isValid: false, message: "Invalid game type" };
    }
    return { isValid: true, message: "" };
  };

  const getGameTypeDisplay = (type) => {
    const display = {
      single: "Single",
      jodi: "Jodi",
      panna: "Panna",
      "half-sangam": "Half-Sangam",
      "full-sangam": "Full-Sangam",
      "last-digit": "Last Digit",
      "first-digit": "First Digit"
    };
    return display[type] || type;
  };

  const getGameTypeGradient = (type) => {
    const gradients = {
      single: "from-blue-500 to-indigo-600",
      jodi: "from-green-500 to-emerald-600",
      panna: "from-purple-500 to-violet-600",
      "half-sangam": "from-orange-500 to-amber-600",
      "full-sangam": "from-red-500 to-rose-600",
      "last-digit": "from-cyan-500 to-blue-600",
      "first-digit": "from-pink-500 to-rose-600"
    };
    return gradients[type] || "from-gray-500 to-gray-600";
  };

  const getGameTypeIcon = (type) => {
    const icons = {
      single: "🎯",
      jodi: "🔢",
      panna: "🎲",
      "half-sangam": "🌓",
      "full-sangam": "🌕",
      "last-digit": "🔚",
      "first-digit": "🔛"
    };
    return icons[type] || "⭐";
  };

  const getNumberPlaceholder = (gameType) => {
    const placeholders = {
      single: "Enter a single digit (0-9)",
      jodi: "Enter a 2-digit number (00-99)",
      panna: "Enter a 3-digit number (000-999)",
      "half-sangam": "Enter 1-digit or 3-digit number (0-9 or 000-999)",
      "full-sangam": "Enter a 2-digit number (00-99)",
      "last-digit": "Enter a 2-digit number (00-99)",
      "first-digit": "Enter a 2-digit number (00-99)"
    };
    return placeholders[gameType] || "Enter your number";
  };

  const getNumberHint = (gameType) => {
    const hints = {
      single: "Single digit (0-9)",
      jodi: "Two digits (00-99)",
      panna: "Three digits (000-999)",
      "half-sangam": "1-digit (0-9) or 3-digit (000-999)",
      "full-sangam": "Two digits (00-99)",
      "last-digit": "Two digits (00-99) - Last digit will be checked",
      "first-digit": "Two digits (00-99) - First digit will be checked"
    };
    return hints[gameType] || "";
  };

  const calculateWinAmount = () => {
    if (!formData.bidAmount || !formData.gameType) return 0;
    const amount = parseFloat(formData.bidAmount);
    const multipliers = {
      single: 9,
      jodi: 90,
      panna: 90,
      "half-sangam": 450,
      "full-sangam": 900,
      "last-digit": 9,
      "first-digit": 9
    };
    return amount * (multipliers[formData.gameType] || 9);
  };

  const getMultiplierDisplay = (gameType) => {
    const multipliers = {
      single: "9x",
      jodi: "90x",
      panna: "90x",
      "half-sangam": "450x",
      "full-sangam": "900x",
      "last-digit": "9x",
      "first-digit": "9x"
    };
    return multipliers[gameType] || "9x";
  };

  const getWinDescription = (gameType) => {
    const descriptions = {
      single: "Match the exact single digit",
      jodi: "Match the exact two-digit number",
      panna: "Match the exact three-digit number",
      "half-sangam": "Match 1-digit or 3-digit combination",
      "full-sangam": "Match the exact two-digit number",
      "last-digit": "Match the last digit of winning number",
      "first-digit": "Match the first digit of winning number"
    };
    return descriptions[gameType] || "Match the winning number";
  };

  const isNumberSelectable = (num) => {
    if (!formData.gameType) return true;
    const numValue = parseInt(num);
    if (formData.gameType === "single") {
      return numValue <= 9;
    }
    if (formData.gameType === "half-sangam") {
      return numValue <= 9 || numValue >= 100;
    }
    return true;
  };

  if (marketLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-amber-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentMarket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
          <div className="text-7xl mb-4 animate-float">🔍</div>
          <p className="text-gray-600 text-xl font-semibold">Market not found</p>
          <button
            onClick={() => navigate("/matka/markets")}
            className="mt-4 inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold transition-colors"
          >
            ← Back to Markets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/matka/markets")}
          className="group flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-all duration-300 hover:translate-x-[-4px]"
        >
          <ArrowLeft size={18} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Back to Markets</span>
        </button>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Number Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-shadow duration-300">
              {/* Grid Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                    <Grid size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-gray-800 font-bold text-lg">Select Your Number</h2>
                    <p className="text-gray-400 text-xs">Click on any number to select</p>
                  </div>
                </div>
                {selectedNumber && (
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 rounded-xl animate-pulse shadow-lg shadow-amber-200">
                    <span className="text-white font-bold text-lg">Selected: {selectedNumber}</span>
                  </div>
                )}
              </div>

              {/* Number Grid - Shows 1 to 99 then 00 */}
              <div className="grid grid-cols-10 gap-1.5">
                {numberGrid.map((num) => (
                  <button
                    key={num}
                    onClick={() => isNumberSelectable(num) && handleNumberSelect(num)}
                    onMouseEnter={() => setHoveredNumber(num)}
                    onMouseLeave={() => setHoveredNumber(null)}
                    disabled={!isNumberSelectable(num)}
                    className={`
                      relative aspect-square rounded-lg font-mono font-bold text-sm transition-all duration-200
                      ${selectedNumber === num
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white scale-110 shadow-lg shadow-amber-300 ring-2 ring-amber-400 ring-offset-2 ring-offset-white'
                        : hoveredNumber === num
                          ? 'bg-amber-50 text-amber-700 scale-105 border-2 border-amber-400'
                          : 'bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-700 border border-gray-200 hover:border-amber-300'
                      }
                      ${!isNumberSelectable(num) && 'opacity-30 cursor-not-allowed'}
                      ${num === '00' ? 'col-span-1' : ''}
                    `}
                  >
                    <span className="relative z-10">{num}</span>
                    {selectedNumber === num && (
                      <div className="absolute inset-0 animate-pulse rounded-lg bg-gradient-to-r from-amber-400/20 to-orange-500/20"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Grid Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div>
                  <span>Available</span>
                </div>
                {(formData.gameType === "single" || formData.gameType === "half-sangam") && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
                    <span>Disabled for {formData.gameType === "single" ? "Single (0-9 only)" : "Half-Sangam (0-9 or 100-999)"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-shadow duration-300">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-800">
                  {currentMarket.name}
                </h1>
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  <Sparkles size={14} className="text-amber-400" />
                  ID: {currentMarket.marketId}
                </p>
                {autoGameType && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-sm font-medium text-amber-700">
                      {getGameTypeIcon(autoGameType)} {getGameTypeDisplay(autoGameType)}
                    </span>
                  </div>
                )}
              </div>

              {/* Market Info */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Game Type</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-lg bg-gradient-to-r ${getGameTypeGradient(currentMarket.gameType)} text-white shadow-lg`}>
                    {getGameTypeDisplay(currentMarket.gameType)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Bid Range</p>
                  <p className="font-bold text-gray-800 mt-1">{currencySymbol}{currentMarket.minBid} - {currencySymbol}{currentMarket.maxBid}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Open Time</p>
                  <p className="font-bold text-gray-800 mt-1 flex items-center gap-1">
                    <Clock size={14} className="text-green-500" /> {currentMarket.openTime}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Close Time</p>
                  <p className="font-bold text-gray-800 mt-1 flex items-center gap-1">
                    <Clock size={14} className="text-red-500" /> {currentMarket.closeTime}
                  </p>
                </div>
              </div>

              {/* Balance */}
              <div className="relative group/balance mb-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 flex justify-between items-center border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200">
                      <Wallet size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Available Balance</p>
                      <p className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                        {formatCurrency(user?.balance.local || 0)}
                      </p>
                    </div>
                  </div>
                  <Shield size={28} className="text-green-300" />
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-3">
                  {/* Game Type Select */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 flex items-center gap-2">
                      <Award size={16} className="text-amber-500" />
                      Game Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="gameType"
                        value={formData.gameType}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-800 appearance-none transition duration-200 ${
                          autoGameType && formData.gameType === autoGameType
                            ? 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-100'
                            : 'border-gray-200 hover:border-amber-300'
                        }`}
                        required
                      >
                        <option value="" className="bg-white">🎮 Select Game Type</option>
                        {gameTypes.map((type) => (
                          <option key={type} value={type} className="bg-white">
                            {getGameTypeIcon(type)} {getGameTypeDisplay(type)}
                            {autoGameType === type && " ★"}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight size={18} className={`text-gray-400 transition-transform ${formData.gameType ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    {autoGameType && formData.gameType === autoGameType && (
                      <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        Game type automatically selected from market
                      </p>
                    )}
                  </div>

                  {/* Number Input */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 flex items-center gap-2">
                      <Coins size={16} className="text-amber-500" />
                      Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="number"
                      value={formData.number}
                      onChange={handleChange}
                      placeholder={getNumberPlaceholder(formData.gameType)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-800 transition duration-200 hover:border-amber-300 text-lg font-mono"
                      required
                    />
                    {formData.gameType && (
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <Info size={12} />
                        Format: {getNumberHint(formData.gameType)}
                      </p>
                    )}
                  </div>

                  {/* Bid Amount */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1.5 flex items-center gap-2">
                      <TrendingUp size={16} className="text-amber-500" />
                      Bid Amount ({currencySymbol}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="bidAmount"
                      value={formData.bidAmount}
                      onChange={handleChange}
                      placeholder={`${currencySymbol}${currentMarket.minBid} - ${currencySymbol}${currentMarket.maxBid}`}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-800 transition duration-200 hover:border-amber-300 text-lg font-semibold"
                      min={currentMarket.minBid}
                      max={currentMarket.maxBid}
                      required
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            bidAmount: currentMarket.minBid.toString(),
                          })
                        }
                        className="text-xs px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 font-medium text-gray-600"
                      >
                        Min
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            bidAmount: currentMarket.maxBid.toString(),
                          })
                        }
                        className="text-xs px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 font-medium text-gray-600"
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* Win Info */}
                  {formData.bidAmount && formData.gameType && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-200 flex-shrink-0">
                          <Crown size={18} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Potential Win:</span>
                            <span className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                              {formatCurrency(calculateWinAmount())}
                            </span>
                            <span className="text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-2 py-0.5 rounded-full">
                              {getMultiplierDisplay(formData.gameType)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Info size={12} />
                            {getWinDescription(formData.gameType)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error/Success Messages */}
                  {localError && (
                    <div className="animate-shake bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      {localError}
                    </div>
                  )}

                  {success && (
                    <div className={`bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${showSuccessAnimation ? 'animate-success-pop' : ''}`}>
                      <span className="text-lg">✅</span>
                      {success}
                    </div>
                  )}

                  {/* Submit Button - Original Amber/Orange Style */}
                  <button
                    type="submit"
                    disabled={bidLoading}
                    className="relative group/btn w-full overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 rounded-xl blur opacity-30 group-hover/btn:opacity-50 transition duration-500"></div>
                    <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 py-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-lg shadow-lg shadow-amber-500/30">
                      {bidLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          Placing Bid...
                        </>
                      ) : (
                        <>
                          <Zap size={20} />
                          Place Bid
                          <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes success-pop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-success-pop {
          animation: success-pop 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PlaceBid;