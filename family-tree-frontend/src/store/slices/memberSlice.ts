import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Member, MemberWithRelationships } from '@/types';

interface MemberState {
  currentMember: MemberWithRelationships | null;
  familyMembers: Member[];
  loading: boolean;
  error: string | null;
}

const initialState: MemberState = {
  currentMember: null,
  familyMembers: [],
  loading: false,
  error: null,
};

const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCurrentMember: (state, action: PayloadAction<MemberWithRelationships>) => {
      state.currentMember = action.payload;
      state.loading = false;
      state.error = null;
    },
    setFamilyMembers: (state, action: PayloadAction<Member[]>) => {
      state.familyMembers = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateCurrentMember: (state, action: PayloadAction<Partial<MemberWithRelationships>>) => {
      if (state.currentMember) {
        state.currentMember = { ...state.currentMember, ...action.payload };
      }
    },
    addFamilyMember: (state, action: PayloadAction<Member>) => {
      state.familyMembers.push(action.payload);
    },
    updateFamilyMember: (state, action: PayloadAction<Member>) => {
      const index = state.familyMembers.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.familyMembers[index] = action.payload;
      }
    },
    removeFamilyMember: (state, action: PayloadAction<string>) => {
      state.familyMembers = state.familyMembers.filter(m => m.id !== action.payload);
    },
    clearMemberData: (state) => {
      state.currentMember = null;
      state.familyMembers = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setCurrentMember,
  setFamilyMembers,
  updateCurrentMember,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
  clearMemberData,
} = memberSlice.actions;

export default memberSlice.reducer;
