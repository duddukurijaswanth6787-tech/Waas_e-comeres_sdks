export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  pincode: string;
  couponCode?: string;
  paymentMethod: "RAZORPAY" | "COD" | "WHATSAPP_MANUAL";
}

export class CartModule {
  private items: CartItem[] = [];
  private readonly storageKey: string;

  constructor(clientId: string) {
    this.storageKey = `ecom_cart_${clientId}`;
    this.loadCart();
  }

  private loadCart(): void {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) this.items = JSON.parse(saved);
    } catch {
      this.items = [];
    }
  }

  private saveCart(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    window.dispatchEvent(new CustomEvent("ecom:cart:updated", { detail: this.getItems() }));
  }

  public addItem(item: Omit<CartItem, "quantity">, quantity = 1): CartItem[] {
    const existingIndex = this.items.findIndex(
      (i) => i.id === item.id && i.size === item.size && i.color === item.color
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({ ...item, quantity });
    }
    this.saveCart();
    return this.getItems();
  }

  public removeItem(itemId: string, size?: string, color?: string): CartItem[] {
    this.items = this.items.filter(
      (i) => !(i.id === itemId && i.size === size && i.color === color)
    );
    this.saveCart();
    return this.getItems();
  }

  public updateQuantity(itemId: string, quantity: number, size?: string, color?: string): CartItem[] {
    const item = this.items.find(
      (i) => i.id === itemId && i.size === size && i.color === color
    );
    if (item) {
      if (quantity <= 0) {
        return this.removeItem(itemId, size, color);
      }
      item.quantity = quantity;
      this.saveCart();
    }
    return this.getItems();
  }

  public getItems(): CartItem[] {
    return [...this.items];
  }

  public getSubtotal(): number {
    return this.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  }

  public getDeliveryFee(): number {
    const subtotal = this.getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal >= 2999 ? 0 : 99;
  }

  public getTotal(): number {
    return this.getSubtotal() + this.getDeliveryFee();
  }

  public getTotalAmount(): number {
    return this.getTotal();
  }

  public clearCart(): void {
    this.items = [];
    this.saveCart();
  }
}
