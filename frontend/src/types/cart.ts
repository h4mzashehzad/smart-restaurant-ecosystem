export interface CartItemCustomization {
  ingredient_id: number;
  name: string;
  quantity: number;
  default_quantity: number;
  unit?: string;
  extra_unit_price: number;
  price_adjustment: number;
}

export interface CartItem {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image_url: string | null;
  is_signature: boolean;
  quantity: number;
  unitPrice: number;
  customizations?: CartItemCustomization[];
  /** Composite key: menu item id + customization signature */
  lineKey: string;
}

export interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  specialInstructions: string;
}

/** Build a stable cart line key from menu item id + customizations. */
export function buildCartLineKey(
  menuItemId: number,
  customizations?: CartItemCustomization[] | null
): string {
  if (!customizations || customizations.length === 0) {
    return String(menuItemId);
  }

  const signature = [...customizations]
    .map((c) => `${c.ingredient_id}:${c.quantity}`)
    .sort()
    .join('|');

  return `${menuItemId}::${signature}`;
}
