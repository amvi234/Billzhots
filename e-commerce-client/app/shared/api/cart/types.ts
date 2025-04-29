export type CartItem = {
    id: string;
    title: string;
    prompt: string;
    report_data: any;
    created_at: string;
    product_category?: string;
    price_range_min?: number;
    price_range_max?: number;
  }

  export type AddToCartPayload = {
    title: string;
    prompt: string;
    report_data: any;
    product_category?: string;
    price_range_min?: number;
    price_range_max?: number;
  }

  export type CartCountResponse  = {
    count: number;
  }
