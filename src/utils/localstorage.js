export const CART_KEY = "products";

export class LocalStorage {
  static getStorageAsJSON(storageName) {
    return JSON.parse(localStorage.getItem(storageName)) || [];
  }

  static saveToStorage(storageName, obj) {
    const product = {
      productId: obj._id || obj.productId,
      name: obj.name,
      price: obj.price,
      quantity: 1,
      imageUrl: obj.imageUrl,
    };

    let storage = this.getStorageAsJSON(storageName) || [];

    const existingProductIndex = storage.findIndex(
      (item) => item.productId === product.productId
    );

    if (existingProductIndex !== -1) {
      storage[existingProductIndex].quantity += 1;
    } else {
      storage.push(product);
    }

    localStorage.setItem(storageName, JSON.stringify(storage));
  }

  static decrementFromStorage(storageName, productId) {
    let storage = this.getStorageAsJSON(storageName) || [];

    const existingProductIndex = storage.findIndex(
      (item) => item.productId === productId
    );

    if (existingProductIndex !== -1) {
      if (storage[existingProductIndex].quantity > 1) {
        storage[existingProductIndex].quantity -= 1;
      } else {
        storage.splice(existingProductIndex, 1);
      }

      localStorage.setItem(storageName, JSON.stringify(storage));
      return true;
    }

    return false;
  }

  static clearStorage(storageName) {
    localStorage.removeItem(storageName);
  }
}
