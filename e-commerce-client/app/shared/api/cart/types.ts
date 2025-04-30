export type AddToCartPayload = {
  prompt: string;
  report_data: string;
};

export type GenerateRequestPayload = {
  prompt: string;
}

export type CartCountResponse = {
    count: number;
}
