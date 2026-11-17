"use client";

import { create } from "zustand";

type CheckoutState = {
  waiting: boolean;
  lastRefresh: number | null;
  setWaiting: (waiting: boolean) => void;
  touch: () => void;
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  waiting: false,
  lastRefresh: null,
  setWaiting: (waiting) => set({ waiting }),
  touch: () => set({ lastRefresh: Date.now() }),
}));
