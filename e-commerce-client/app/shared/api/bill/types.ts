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
