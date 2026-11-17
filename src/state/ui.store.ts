"use client";

import { create } from "zustand";
import { createId } from "@/lib/id";

type Toast = { id: string; message: string };

type UiState = {
  navOpen: boolean;
  toasts: Toast[];
  toggleNav: () => void;
  closeNav: () => void;
  pushToast: (message: string) => void;
  dismiss: (id: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  navOpen: false,
  toasts: [],
  toggleNav: () => set((state) => ({ navOpen: !state.navOpen })),
  closeNav: () => set({ navOpen: false }),
  pushToast: (message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: createId(), message }],
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
