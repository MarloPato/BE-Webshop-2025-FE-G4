import { UserBuilder } from "../builders/userBuilder.js";
import { fetchProducts } from "../utils/api.js";
import { Cart } from "../classes/cart.js";
import { LocalStorage, CART_KEY } from "../utils/localstorage.js";
import { Builder } from "../builders/builder.js";
import { auth } from "../utils/auth.js";
import { ProductFormBuilder } from "../builders/ProductFormBuilder.js";
import { initProductHandlers } from "../builders/productHandlers.js";

document.addEventListener("DOMContentLoaded", loadProducts);
const modal = document.querySelector("#modal");

let cart = {};
if (LocalStorage.getStorageAsJSON(CART_KEY)) {
  let items = LocalStorage.getStorageAsJSON(CART_KEY);
  cart = new Cart(items);
} else {
  cart = new Cart();
}
cart.updateCart();
let allProducts = [];

async function loadProducts() {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "<p>Loading products...</p>";

  try {

    const products = await fetchProducts();
    allProducts = products;
    productsContainer.innerHTML = "";

    if (products.length > 0) {
      let productBuilder = new UserBuilder();
      for (let x = 0; x < products.length; x++) {
        productBuilder.buildProductCard(products[x]);
        let productCards = productBuilder.build();
        productsContainer.append(productCards[x]);
      }
    } else {
      productsContainer.innerHTML = "<p>No products available.</p>";
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    productsContainer.innerHTML = "<p>Failed to load products.</p>";
  }
  renderProductCardEventListeners(allProducts);
}

const renderProductCardEventListeners = (allProducts = []) => {
  let addProductBtns = document.querySelectorAll(".add-to-cart-btn");
  addProductBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      let product = allProducts.find((p) => p._id == btn.id.substring(btn.id.lastIndexOf("-") + 1));
      addToCart(product);
    });
  });
  let products = document.querySelectorAll(".product-card");
  products.forEach((product) => {
    product.addEventListener("click", (event) => {
      if (event.target.tagName.toLowerCase() !== "button") {
        let builder = new UserBuilder();
        builder.buildProductCardInfo(allProducts.find((p) => p._id == product.id));
        let productInfo = builder.build();
        let modalContent = document.querySelector("#modalContent");
        modalContent.append(productInfo[0]);
        modal.showModal();
        let addToCartBtn = modalContent.querySelector(".add-to-cart-btn");
        addToCartBtn.addEventListener("click", () => {
          addToCart(allProducts.find((p) => p._id == product.id));
        });
      }
    });
  });
};

const openCart = (parentElement, userCart) => {
  let builder = new UserBuilder();
  builder.buildCartInfo(userCart);
  let child = builder.build();
  child.forEach((c) => parentElement.append(c));

  const clearButton = parentElement.querySelector(".clear-cart-btn");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      userCart.clearCart();
      LocalStorage.clearStorage(CART_KEY);
      parentElement.innerHTML =
        "<p style='text-align: center; margin: 20px 10px;'>" +
        "<span style='font-size: 1.5em; margin-right: 10px;'>🗑️</span>" +
        "Din varukorg är nu tömd.</p>";
    });
  }
};

const addToCart = (product) => {
  cart.addItem(product);
  cart.updateCart();
  LocalStorage.saveToStorage(CART_KEY, product);
  alert(`${product.name} har lagts till i varukorgen`);
};

const cartBtn = document.querySelector("[data-cart]");
const closeCartBtn = document.querySelector("[data-close-bar]");
closeCartBtn.addEventListener("click", () => {
  let sidebar = document.querySelector("dialog[data-sidebar]");
  sidebar.close();
});
cartBtn.addEventListener("click", () => {
  let sidebar = document.querySelector("dialog[data-sidebar]");
  let section = sidebar.querySelector("dialog[data-sidebar] section");
  openCart(section, cart);
  sidebar.showModal();
  sidebar.addEventListener("close", () => {
    section.innerHTML = "";
  });
});

document.querySelector("#closeModal").addEventListener("click", () => {
  modal.close();
});

modal.addEventListener("close", () => {
  document.querySelector("#modalContent").innerHTML = "";
});
