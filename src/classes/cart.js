export class Cart {
  constructor(items = []) {
    this.items = items;
  }

  getItems() {
    return this.items;
  }

  addItem(item) {
    this.items.push(item);
  }

  incrementItem(productId) {
    const existingItem = this.items.find(
      (item) => item._id === productId || item.productId === productId
    );

    if (existingItem) {
      this.items.push(existingItem);
    }
  }

  decrementItem(productId) {
    const index = this.items.findIndex(
      (item) => item._id === productId || item.productId === productId
    );

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  getTotal() {
    return this.items.reduce((total, item) => total + item.price, 0);
  }

  updateCart() {
    let cartLink = document.querySelector("[data-cart]");
    cartLink.textContent = `Cart (${this.items.length})`;
  }

  clearCart() {
    this.items = [];
    this.updateCart();
  }
}
