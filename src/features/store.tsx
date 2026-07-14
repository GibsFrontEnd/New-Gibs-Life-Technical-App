import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducers/authReducers/authSlice";
import agentReducer from '../features/reducers/csuReducers/agentSlice'
import roleReducer from "./reducers/adminReducers/roleSlice";
import uiReducer from "./reducers/uiReducers/uiSlice";
import permissionReducer from "./reducers/adminReducers/permissionSlice";
import userReducer from "./reducers/adminReducers/userSlice";
import riskReducer from "./reducers/adminReducers/riskSlice";
import productReducer from "./reducers/productReducers/productSlice";
import subRiskSectionReducer from "./reducers/productReducers/subRiskSectionSlice"
import subRiskSMIReducer from "./reducers/productReducers/subRiskSMISlice";
import partyTypeReducer from "./reducers/adminReducers/partyTypeSlice";
import policyReducer from "./reducers/csuReducers/policySlice";
import branchReducer from "./reducers/companyReducers/branchSlice";
import customerReducer from "./reducers/csuReducers/customerSlice";
import partyReducer from "./reducers/csuReducers/agentSlice";
import marketingStaffReducer from "./reducers/companyReducers/marketingStaffSlice";
import regionReducer from './reducers//productReducers/regionSlice';
import proposalReducer from "./reducers/individualLifeReducers/proposalSlice";
import quotationReducer from './reducers/quotationReducers/quotationSlice';
import groupLifeReducer from "./reducers/groupLifeReducers/groupLifeQuotationSlice";
import beneficiaryReducer from "./reducers/beneficiariesReducers/beneficiariesSlice";
import documentReducer from "./reducers/documentReducers/documentSlice";
import investmentProposalsReducer from "./reducers/proposalReducers/proposalsSlice";
import claimsReducer from './reducers/claimsReducers/claimsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
   agents: agentReducer,
    ui: uiReducer,
    roles: roleReducer,
    permissions: permissionReducer,
    users: userReducer,
    risks: riskReducer,
    products: productReducer,
    subRiskSections: subRiskSectionReducer,
    subRiskSMIs: subRiskSMIReducer,
    partyTypes: partyTypeReducer,
    policies: policyReducer,
    regions: regionReducer,
    branches: branchReducer,
    customers: customerReducer,
    parties: partyReducer,
    marketingStaff: marketingStaffReducer,
    proposals: proposalReducer,
    quotation: quotationReducer,
    groupLifeQuotations: groupLifeReducer,
    beneficiaries: beneficiaryReducer,
    documents: documentReducer,
    investmentProposals: investmentProposalsReducer,
    claims: claimsReducer,


  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
