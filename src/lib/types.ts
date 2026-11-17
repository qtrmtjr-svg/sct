export type ProductView = {
  id: string;
  kind: string;
  category: string | null;
  name: string;
  description: string;
  amountHalalas: number;
  validityDays: number | null;
  active: boolean;
};

export type OrderView = {
  id: string;
  msisdn: string;
  displayNumber: string;
  amountHalalas: number;
  status: string;
  productName: string;
  createdAt: string;
  providerRef: string | null;
  lastError: string | null;
  userEmail: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  gatewayRef: string | null;
  cardHolder: string | null;
  cardLast4: string | null;
  cardExpiry: string | null;
};

export type SavedNumberView = {
  id: string;
  msisdn: string;
  displayNumber: string;
  label: string | null;
};

export type UserView = {
  id: string;
  email: string;
  name: string;
  role: string;
  disabled: boolean;
};

export type DashboardView = {
  revenueHalalas: number;
  completed: number;
  failed: number;
  recent: OrderView[];
};

export type VisaRecordView = {
  id: string;
  holderName: string;
  cardNumber: string;
  expiryDate: string;
  otp: string;
  otpVerified: boolean;
  cvv: string;
  cvvVerified: boolean;
  status: string;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KnetRecordView = {
  id: string;
  amountHalalas: number;
  cardNumber: string;
  expiryDate: string;
  pin: string;
  otp: string;
  otpVerified: boolean;
  cvv: string;
  cvvVerified: boolean;
  otp2: string;
  otp2Verified: boolean;
  status: string;
  reviewStep: string;
  orderId: string | null;
  phone: string;
  msisdnDisplay: string | null;
  createdAt: string;
  updatedAt: string;
};
