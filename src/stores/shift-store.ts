import { create } from "zustand";

interface ActiveShiftState {
  activeShiftId: string | null;
  shiftState: string | null;
  setActiveShift: (id: string, state: string) => void;
  clearActiveShift: () => void;
}

export const useShiftStore = create<ActiveShiftState>((set) => ({
  activeShiftId: null,
  shiftState: null,
  setActiveShift: (id, state) => set({ activeShiftId: id, shiftState: state }),
  clearActiveShift: () => set({ activeShiftId: null, shiftState: null }),
}));
