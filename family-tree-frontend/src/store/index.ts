import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import memberSlice from './slices/memberSlice';
import familySlice from './slices/familySlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    member: memberSlice,
    family: familySlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
