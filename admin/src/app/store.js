import { configureStore } from "@reduxjs/toolkit";

import adminAuthReducer from "../admin/redux/adminAuthSlice";
import depositSettingsReducer from "../admin/redux/depositSettingsSlice";
import depositsReducer from "../admin/redux/depositSlice";
import withdrawalReducer from "../admin/redux/withdrawalSlice";
import withdrawalSettingsReducer from "../admin/redux/withdrawalSettingsSlice";
import bannerReducer from "../admin/redux/bannerSlice";
import ticketTypeReducer from "../admin/redux/ticketTypeSlice";

import adminMarketReducer from "../admin/redux/adminMarketSlice";
import adminBidReducer from "../admin/redux/adminBidSlice";
import adminResultReducer from "../admin/redux/adminResultSlice";
import currencyRateReducer from "../admin/redux/currencyRateSlice";

// ========================================
// AUSTRALIA
// ========================================
import australiaGameCountReducer from "../admin/redux/australia/gameCountSlice";
import australiaGameEntryReducer from "../admin/redux/australia/gameEntrySlice";
import australiaPowerballResultReducer from "../admin/redux/australia/powerballResultSlice";

// ========================================
// PAKISTAN
// ========================================
import pakistanGameCountReducer from "../admin/redux/pakistan/gameCountSlice";
import pakistanGameEntryReducer from "../admin/redux/pakistan/gameEntrySlice";
import pakistanPowerballResultReducer from "../admin/redux/pakistan/powerballResultSlice";

// ========================================
// CANADA
// ========================================
import canadaGameCountReducer from "../admin/redux/canada/gameCountSlice";
import canadaGameEntryReducer from "../admin/redux/canada/gameEntrySlice";
import canadaPowerballResultReducer from "../admin/redux/canada/powerballResultSlice";

// ========================================
// INDIA
// ========================================
import indiaGameCountReducer from "../admin/redux/india/gameCountSlice";
import indiaGameEntryReducer from "../admin/redux/india/gameEntrySlice";
import indiaPowerballResultReducer from "../admin/redux/india/powerballResultSlice";

// ========================================
// NEPAL
// ========================================
import nepalGameCountReducer from "../admin/redux/nepal/gameCountSlice";
import nepalGameEntryReducer from "../admin/redux/nepal/gameEntrySlice";
import nepalPowerballResultReducer from "../admin/redux/nepal/powerballResultSlice";

// ========================================
// UAE
// ========================================
import uaeGameCountReducer from "../admin/redux/uae/gameCountSlice";
import uaeGameEntryReducer from "../admin/redux/uae/gameEntrySlice";
import uaePowerballResultReducer from "../admin/redux/uae/powerballResultSlice";

import referralLevelReducer from "../admin/redux/referralLevelSlice";
import bettingBonusReducer from "../admin/redux/bettingBonusSlice";


export const store = configureStore({
  reducer: {

    // ========================================
    // ADMIN
    // ========================================
    adminAuth: adminAuthReducer,
    depositSettings: depositSettingsReducer,
    deposits: depositsReducer,
    withdrawals: withdrawalReducer,
    withdrawalSettings: withdrawalSettingsReducer,
    banner: bannerReducer,
    ticketType: ticketTypeReducer,
    bettingBonus: bettingBonusReducer,



    // ========================================
    // AUSTRALIA
    // ========================================
    australiaGameCount: australiaGameCountReducer,
    australiaGameEntries: australiaGameEntryReducer,
    australiaPowerballResult: australiaPowerballResultReducer,


    // ========================================
    // PAKISTAN
    // ========================================
    pakistanGameCount: pakistanGameCountReducer,
    pakistanGameEntries: pakistanGameEntryReducer,
    pakistanPowerballResult: pakistanPowerballResultReducer,


    // ========================================
    // CANADA
    // ========================================
    canadaGameCount: canadaGameCountReducer,
    canadaGameEntries: canadaGameEntryReducer,
    canadaPowerballResult: canadaPowerballResultReducer,


    // ========================================
    // INDIA
    // ========================================
    indiaGameCount: indiaGameCountReducer,
    indiaGameEntries: indiaGameEntryReducer,
    indiaPowerballResult: indiaPowerballResultReducer,


    // ========================================
    // NEPAL
    // ========================================
    nepalGameCount: nepalGameCountReducer,
    nepalGameEntries: nepalGameEntryReducer,
    nepalPowerballResult: nepalPowerballResultReducer,


    // ========================================
    // UAE
    // ========================================
    uaeGameCount: uaeGameCountReducer,
    uaeGameEntries: uaeGameEntryReducer,
    uaePowerballResult: uaePowerballResultReducer,


    // ========================================
    // OTHER ADMIN
    // ========================================
    adminMarket: adminMarketReducer,
    adminBid: adminBidReducer,
    adminResult: adminResultReducer,
    currencyRate: currencyRateReducer,
    referralLevel: referralLevelReducer,

  },
});