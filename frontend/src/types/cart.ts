export interface CartItem {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image_url: string | null;
  is_signature: boolean;
  quantity: number;
  unitPrice: number;
}

export interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  specialInstructions: string;
}
