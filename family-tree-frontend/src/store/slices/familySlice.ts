import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Family, FamilyMembership, Invitation } from '@/types';

interface FamilyState {
  families: Family[];
  currentFamily: Family | null;
  familyMemberships: FamilyMembership[];
  invitations: Invitation[];
  loading: boolean;
  error: string | null;
}

const initialState: FamilyState = {
  families: [],
  currentFamily: null,
  familyMemberships: [],
  invitations: [],
  loading: false,
  error: null,
};

const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFamilies: (state, action: PayloadAction<Family[]>) => {
      state.families = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCurrentFamily: (state, action: PayloadAction<Family>) => {
      state.currentFamily = action.payload;
    },
    setFamilyMemberships: (state, action: PayloadAction<FamilyMembership[]>) => {
      state.familyMemberships = action.payload;
    },
    setInvitations: (state, action: PayloadAction<Invitation[]>) => {
      state.invitations = action.payload;
      state.loading = false;
      state.error = null;
    },
    addFamily: (state, action: PayloadAction<Family>) => {
      state.families.push(action.payload);
    },
    updateFamily: (state, action: PayloadAction<Family>) => {
      const index = state.families.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.families[index] = action.payload;
      }
      if (state.currentFamily?.id === action.payload.id) {
        state.currentFamily = action.payload;
      }
    },
    removeFamily: (state, action: PayloadAction<string>) => {
      state.families = state.families.filter(f => f.id !== action.payload);
      if (state.currentFamily?.id === action.payload) {
        state.currentFamily = null;
      }
    },
    addInvitation: (state, action: PayloadAction<Invitation>) => {
      state.invitations.push(action.payload);
    },
    updateInvitation: (state, action: PayloadAction<Invitation>) => {
      const index = state.invitations.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.invitations[index] = action.payload;
      }
    },
    clearFamilyData: (state) => {
      state.families = [];
      state.currentFamily = null;
      state.familyMemberships = [];
      state.invitations = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setFamilies,
  setCurrentFamily,
  setFamilyMemberships,
  setInvitations,
  addFamily,
  updateFamily,
  removeFamily,
  addInvitation,
  updateInvitation,
  clearFamilyData,
} = familySlice.actions;

export default familySlice.reducer;
