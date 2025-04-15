export const CART_KEY = "products";

export class LocalStorage {
  static getStorageAsJSON(storageName) {
    return JSON.parse(localStorage.getItem(storageName));
  }

  static saveToStorage(storageName, obj) {
    const product = {
      productId: obj._id,
      name: obj.name,
      price: obj.price,
      quantity: 1
    }

    let storage = this.getStorageAsJSON(storageName) || [];

    // Kolla om produkten redan finns i storage
    const existingProduct = storage.find(item => item.productId === product.productId);

    if (existingProduct) {
      // Om produkten finns, öka quantity
      existingProduct.quantity += 1;
    } else {
      // Annars lägg till produkten
      storage.push(product);
    }

    localStorage.setItem(storageName, JSON.stringify(storage));

  }

  static clearStorage(storageName) {
    localStorage.removeItem(storageName);
  }
}
