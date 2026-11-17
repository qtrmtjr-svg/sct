"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createId } from "@/lib/id";

type Kind = "topup" | "package" | "bill" | "voucher";

export type PhoneSaveStatus = "idle" | "saving" | "saved" | "error";

type Draft = {
  msisdn: string;
  productId: string;
  amountHalalas: number;
  kind: Kind;
  idempotencyKey: string;
  hydrated: boolean;
  phoneStatus: PhoneSaveStatus;
  savedMsisdn: string;
  setPhone: (msisdn: string) => void;
  setPhoneStatus: (phoneStatus: PhoneSaveStatus) => void;
  markPhoneSaved: (savedMsisdn: string) => void;
  selectProduct: (productId: string, amountHalalas: number, kind: Kind) => void;
  rotateKey: () => void;
  setHydrated: (hydrated: boolean) => void;
};

const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useRechargeDraft = create<Draft>()(
  persist(
    (set) => ({
      msisdn: "",
      productId: "",
      amountHalalas: 0,
      kind: "topup",
      idempotencyKey: "",
      hydrated: false,
      phoneStatus: "idle",
      savedMsisdn: "",
      setPhone: (msisdn) => set({ msisdn }),
      setPhoneStatus: (phoneStatus) => set({ phoneStatus }),
      markPhoneSaved: (savedMsisdn) => set({ savedMsisdn, phoneStatus: "saved" }),
      selectProduct: (productId, amountHalalas, kind) => set({ productId, amountHalalas, kind }),
      rotateKey: () => set({ idempotencyKey: createId() }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "stc-recharge-draft",
      storage: createJSONStorage(() => (typeof window === "undefined" ? memoryStorage : sessionStorage)),
      skipHydration: true,
      partialize: (state) => ({
        msisdn: state.msisdn,
        productId: state.productId,
        amountHalalas: state.amountHalalas,
        kind: state.kind,
        idempotencyKey: state.idempotencyKey,
        savedMsisdn: state.savedMsisdn,
      }),
    },
  ),
);
