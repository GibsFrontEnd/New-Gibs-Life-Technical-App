import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  // Role dialogs
  showCreateRoleDialog: boolean;
  showEditRoleDialog: boolean;
  showDeleteRoleDialog: boolean;
  showViewRoleDetailsDialog: boolean;

  // Permission dialogs
  showCreatePermissionDialog: boolean;
  showEditPermissionDialog: boolean;
  showDeletePermissionDialog: boolean;
  showViewPermissionDetailsDialog: boolean;

  // User dialogs
  showCreateUserDialog: boolean;
  showEditUserDialog: boolean;
  showDeleteUserDialog: boolean;
  showViewUserDetailsDialog: boolean;
  showChangePasswordDialog: boolean;

  // Risk dialogs
  showCreateRiskDialog: boolean;
  showEditRiskDialog: boolean;
  showDeleteRiskDialog: boolean;
  showViewRiskDetailsDialog: boolean;

  // Sub Risk Section dialogs
  showCreateSubRiskSectionDialog: boolean;
  showEditSubRiskSectionDialog: boolean;
  showDeleteSubRiskSectionDialog: boolean;
  showViewSubRiskSectionDetailsDialog: boolean;

  // Product dialogs
  showCreateProductDialog: boolean;
  showEditProductDialog: boolean;
  showDeleteProductDialog: boolean;
  showViewProductDetailsDialog: boolean;

    // Policy dialogs
    showCreatePolicyDialog: boolean;
    showEditPolicyDialog: boolean;
    showDeletePolicyDialog: boolean;
    showViewPolicyDetailsDialog: boolean;
    showRenewPolicyDialog: boolean;
    showPolicyDetailsDialog: boolean;
  
  

    // Party types risk dialogs
    showCreatePartyTypeDialog: boolean;
    showEditPartyTypeDialog: boolean;
    showDeletePartyTypeDialog: boolean;
    showViewPartyTypeDetailsDialog: boolean;
  
    showCreateCustomerDialog: boolean;
    showEditCustomerDialog: boolean;
    showDeleteCustomerDialog: boolean;
    showCustomerDetailsDialog: boolean;
    showViewCustomerDetailsDialog: boolean;

    showCreateAgentDialog: boolean;
    showEditAgentDialog: boolean;
    showDeleteAgentDialog: boolean;
    showAgentDetailsDialog: boolean;
    showViewAgentDetailsDialog: boolean;

    

  // Region dialogs (NEW - added here)
  showCreateRegionDialog: boolean;
  showEditRegionDialog: boolean;
  showDeleteRegionDialog: boolean;
  showViewRegionDetailsDialog: boolean;

  showCreateBranchDialog: boolean;
  showEditBranchDialog: boolean;
  showDeleteBranchDialog: boolean;
  showViewBranchDetailsDialog: boolean;
}

const initialState: UiState = {
  // Role dialogs
  showCreateRoleDialog: false,
  showEditRoleDialog: false,
  showDeleteRoleDialog: false,
  showViewRoleDetailsDialog: false,

  // Permission dialogs
  showCreatePermissionDialog: false,
  showEditPermissionDialog: false,
  showDeletePermissionDialog: false,
  showViewPermissionDetailsDialog: false,

  // User dialogs
  showCreateUserDialog: false,
  showEditUserDialog: false,
  showDeleteUserDialog: false,
  showViewUserDetailsDialog: false,
  showChangePasswordDialog: false,

  // Risk dialogs
  showCreateRiskDialog: false,
  showEditRiskDialog: false,
  showDeleteRiskDialog: false,
  showViewRiskDetailsDialog: false,

    // Product Sub risk
  // Sub Risk Section dialogs
  showCreateSubRiskSectionDialog: false,
  showEditSubRiskSectionDialog: false,
  showDeleteSubRiskSectionDialog: false,
  showViewSubRiskSectionDetailsDialog: false,

  showCreateCustomerDialog: false,
  showEditCustomerDialog: false,
  showDeleteCustomerDialog: false,
  showCustomerDetailsDialog: false,
  showViewCustomerDetailsDialog: false,

  showCreateAgentDialog: false,
  showEditAgentDialog: false,
  showDeleteAgentDialog: false,
  showAgentDetailsDialog: false,
  showViewAgentDetailsDialog: false,


  
   //  Party Type
  showCreatePartyTypeDialog: false,
  showEditPartyTypeDialog: false,
  showDeletePartyTypeDialog: false,
  showViewPartyTypeDetailsDialog: false,

     // ENQUIRIES Policy 
     showCreatePolicyDialog: false,
     showEditPolicyDialog: false,
     showDeletePolicyDialog: false,
     showViewPolicyDetailsDialog: false,
     showRenewPolicyDialog: false,
     showPolicyDetailsDialog: false,
   
   

  
  // Product Sub risk
  // Product dialogs
  showCreateProductDialog: false,
  showEditProductDialog: false,
  showDeleteProductDialog: false,
  showViewProductDetailsDialog: false,

  // Region dialogs (NEW - added here)
  showCreateRegionDialog: false,
  showEditRegionDialog: false,
  showDeleteRegionDialog: false,
  showViewRegionDetailsDialog: false,

  showCreateBranchDialog: false,
  showEditBranchDialog: false,
  showDeleteBranchDialog: false,
  showViewBranchDetailsDialog: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Role reducers
    setShowCreateRoleDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreateRoleDialog = action.payload;
    },
    setShowEditRoleDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditRoleDialog = action.payload;
    },
    setShowDeleteRoleDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeleteRoleDialog = action.payload;
    },
    setShowViewRoleDetailsDialog: (state, action: PayloadAction<boolean>) => {
      state.showViewRoleDetailsDialog = action.payload;
    },

    // Permission reducers
    setShowCreatePermissionDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreatePermissionDialog = action.payload;
    },
    setShowEditPermissionDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditPermissionDialog = action.payload;
    },
    setShowDeletePermissionDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeletePermissionDialog = action.payload;
    },
    setShowViewPermissionDetailsDialog: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.showViewPermissionDetailsDialog = action.payload;
    },

    // User reducers
    setShowCreateUserDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreateUserDialog = action.payload;
    },
    setShowEditUserDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditUserDialog = action.payload;
    },
    setShowDeleteUserDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeleteUserDialog = action.payload;
    },
    setShowViewUserDetailsDialog: (state, action: PayloadAction<boolean>) => {
      state.showViewUserDetailsDialog = action.payload;
    },
    setShowChangePasswordDialog: (state, action: PayloadAction<boolean>) => {
      state.showChangePasswordDialog = action.payload;
    },

    // Risk reducers
    setShowCreateRiskDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreateRiskDialog = action.payload;
    },
    setShowEditRiskDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditRiskDialog = action.payload;
    },
    setShowDeleteRiskDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeleteRiskDialog = action.payload;
    },
    setShowViewRiskDetailsDialog: (state, action: PayloadAction<boolean>) => {
      state.showViewRiskDetailsDialog = action.payload;
    },

    // Sub Risk Section reducers
    setShowCreateSubRiskSectionDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreateSubRiskSectionDialog = action.payload;
    },
    setShowEditSubRiskSectionDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditSubRiskSectionDialog = action.payload;
    },
    setShowDeleteSubRiskSectionDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeleteSubRiskSectionDialog = action.payload;
    },
    setShowViewSubRiskSectionDetailsDialog: (state, action: PayloadAction<boolean>) => {
      state.showViewSubRiskSectionDetailsDialog = action.payload;
    },

    // Product reducers
    setShowCreateProductDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreateProductDialog = action.payload;
    },
    setShowEditProductDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditProductDialog = action.payload;
    },
    setShowDeleteProductDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeleteProductDialog = action.payload;
    },
    setShowViewProductDetailsDialog: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.showViewProductDetailsDialog = action.payload;
    },

    // Product Party type reducers
    setShowCreatePartyTypeDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreatePartyTypeDialog = action.payload;
    },
    setShowEditPartyTypeDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditPartyTypeDialog = action.payload;
    },
    setShowDeletePartyTypeDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeletePartyTypeDialog = action.payload;
    },
    setShowViewPartyTypeDetailsDialog: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.showViewPartyTypeDetailsDialog = action.payload;
    },

     // Product Policy reducers
     setShowCreatePolicyDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreatePolicyDialog = action.payload;
    },
    setShowEditPolicyDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditPolicyDialog = action.payload;
    },
    setShowDeletePolicyDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeletePolicyDialog = action.payload;
    },
    setShowRenewPolicyDialog: (state, action: PayloadAction<boolean>) => {
      state.showRenewPolicyDialog = action.payload;
    },
    setShowPolicyDetailsDialog: (state, action: PayloadAction<boolean>) => {
      state.showPolicyDetailsDialog = action.payload;
    },
    setShowViewPolicyDetailsDialog: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.showViewPartyTypeDetailsDialog = action.payload;
    },

    // Region reducers (NEW - added here)
    setShowCreateRegionDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreateRegionDialog = action.payload;
    },
    setShowEditRegionDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditRegionDialog = action.payload;
    },
    setShowDeleteRegionDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeleteRegionDialog = action.payload;
    },
    setShowViewRegionDetailsDialog: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.showViewRegionDetailsDialog = action.payload;
    },

    setShowCreateCustomerDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreateCustomerDialog = action.payload;
    },
    setShowEditCustomerDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditCustomerDialog = action.payload;
    },
    setShowDeleteCustomerDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeleteCustomerDialog = action.payload;
    },
    setShowCustomerDetailsDialog: (state, action: PayloadAction<boolean>) => {
      state.showCustomerDetailsDialog = action.payload;
    },
    setShowViewCustomerDetailsDialog: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.showViewCustomerDetailsDialog = action.payload;
    },

    setShowCreateAgentDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreateAgentDialog = action.payload;
    },
    setShowEditAgentDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditAgentDialog = action.payload;
    },
    setShowDeleteAgentDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeleteAgentDialog = action.payload;
    },
    setShowAgentDetailsDialog: (state, action: PayloadAction<boolean>) => {
      state.showAgentDetailsDialog = action.payload;
    },
    setShowViewAgentDetailsDialog: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.showViewAgentDetailsDialog = action.payload;
    },



    setShowCreateBranchDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreateBranchDialog = action.payload;
    },
    setShowEditBranchDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditBranchDialog = action.payload;
    },
    setShowDeleteBranchDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeleteBranchDialog = action.payload;
    },
    setShowViewBranchDetailsDialog: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.showViewBranchDetailsDialog = action.payload;
    },
  },
});

export const {
  // role actions
  setShowCreateRoleDialog,
  setShowEditRoleDialog,
  setShowDeleteRoleDialog,
  setShowViewRoleDetailsDialog,
  
  // permission actions
  setShowCreatePermissionDialog,
  setShowEditPermissionDialog,
  setShowDeletePermissionDialog,
  setShowViewPermissionDetailsDialog,
  
  // User actions
  setShowCreateUserDialog,
  setShowEditUserDialog,
  setShowDeleteUserDialog,
  setShowViewUserDetailsDialog,
  setShowChangePasswordDialog,

  // Risk actions
  setShowCreateRiskDialog,
  setShowEditRiskDialog,
  setShowDeleteRiskDialog,
  setShowViewRiskDetailsDialog,

  // SubRisk actions
  // Sub Risk Section actions
  setShowCreateSubRiskSectionDialog,
  setShowEditSubRiskSectionDialog,
  setShowDeleteSubRiskSectionDialog,
  setShowViewSubRiskSectionDetailsDialog,

  // product actions
  setShowCreateProductDialog,
  setShowEditProductDialog,
  setShowDeleteProductDialog,
  setShowViewProductDetailsDialog,

  setShowCreateCustomerDialog,
  setShowEditCustomerDialog,
  setShowDeleteCustomerDialog,
  setShowCustomerDetailsDialog, 
  setShowViewCustomerDetailsDialog,

  setShowCreateAgentDialog,
  setShowEditAgentDialog,
  setShowDeleteAgentDialog,
  setShowAgentDetailsDialog, 
  setShowViewAgentDetailsDialog,


    // Policy actions
    setShowCreatePolicyDialog,
    setShowEditPolicyDialog,
    setShowDeletePolicyDialog,
    setShowViewPolicyDetailsDialog,
    setShowRenewPolicyDialog,
  setShowPolicyDetailsDialog,
  

  // product Party Type actions
  setShowCreatePartyTypeDialog,
  setShowEditPartyTypeDialog,
  setShowDeletePartyTypeDialog,
  setShowViewPartyTypeDetailsDialog,

  // Region actions (NEW - added here)
  setShowCreateRegionDialog,
  setShowEditRegionDialog,
  setShowDeleteRegionDialog,
  setShowViewRegionDetailsDialog,


  setShowCreateBranchDialog,
  setShowEditBranchDialog,
  setShowDeleteBranchDialog,
  setShowViewBranchDetailsDialog,
} = uiSlice.actions;

export const selectUiState = (state: { ui: UiState }) => state.ui;

export default uiSlice.reducer;