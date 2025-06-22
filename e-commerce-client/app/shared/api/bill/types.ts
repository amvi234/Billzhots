export type BillPayload = {
    id: string,
    name: string,
    content_type: string,
    created_by: string;
}

export type UploadBillResponse = {
    url: string;
}

export type BillIdPayload = {
    billId: string;
}

export type TotalAmountResponse = {
    total_amount: number;
    bills_count: number;
}
