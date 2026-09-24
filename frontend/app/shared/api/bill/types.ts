export enum BillProcessingStatus {
    Pending = 'pending',
    Processing = 'processing',
    Completed = 'completed',
    Failed = 'failed',
}

export type BillPayload = {
    id: string,
    name: string,
    content_type: string,
    created_by: string;
    amount: string | null;
    category: string | null;
    vendor: string;
    bill_date: string | null;
    processing_status: BillProcessingStatus;
    processing_error: string;
    created_at: string;
}

export type UploadBillResponse = {
    url: string;
    processing_status: BillProcessingStatus;
}

export type BillIdPayload = {
    billId: string;
}

export type TotalAmountResponse = {
    total_amount: number;
    bills_count: number;
    pending_count: number;
}

export type CategoryDistributionEntry = {
    category: string;
    label: string;
    total: number;
    count: number;
}
