import { UserBuilder } from "../builders/userBuilder.js";
import { fetchProducts, getBaseUrl } from "../utils/api.js";
import { Cart } from "../classes/cart.js";
import { LocalStorage, CART_KEY } from "../utils/localstorage.js";
import { Builder } from "../builders/builder.js";
import { auth } from "../utils/auth.js";
import { ProductFormBuilder } from "../builders/ProductFormBuilder.js";
import { initProductHandlers } from "../builders/productHandlers.js";

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadCategories();
});

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

async function loadCategories() {
  try {
    const response = await axios.get(`${getBaseUrl()}categories`);

    if (response.status === 200) {
      const categories = response.data;
      const categoryFilter = document.getElementById("categoryFilter");

      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent =
          category.name.charAt(0).toUpperCase() + category.name.slice(1); // Capitalize first letter
        categoryFilter.appendChild(option);
      });

      categoryFilter.addEventListener("change", handleCategoryFilter);
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

async function handleCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter");
  const selectedCategory = categoryFilter.value;
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "<p>Loading products...</p>";

  try {
    let products;
    if (selectedCategory) {
      const response = await axios.get(
        `${getBaseUrl()}products/bycategory?category=${selectedCategory}`
      );
      products = response.status === 200 ? response.data : [];
    } else {
      products = await fetchProducts();
    }

    allProducts = products;
    updateProductsDisplay(products);
  } catch (error) {
    console.error("Error filtering products by category:", error);
    updateProductsDisplay([]);
  }
}
function updateProductsDisplay(products) {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "";

  if (products.length > 0) {
    let productBuilder = new UserBuilder();
    for (let x = 0; x < products.length; x++) {
      productBuilder.buildProductCard(products[x]);
      let productCards = productBuilder.build();
      productsContainer.append(productCards[x]);
    }
  } else {
    productsContainer.innerHTML =
      "<p>No products available for this category.</p>";
  }

  renderProductCardEventListeners(allProducts);
}

async function loadProducts() {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "<p>Loading products...</p>";

  try {
    const products = await fetchProducts();
    allProducts = products;
    updateProductsDisplay(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    productsContainer.innerHTML = "<p>Failed to load products.</p>";
  }
}

const renderProductCardEventListeners = (allProducts = []) => {
  let addProductBtns = document.querySelectorAll(".add-to-cart-btn");
  addProductBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      let product = allProducts.find(
        (p) => p._id == btn.id.substring(btn.id.lastIndexOf("-") + 1)
      );
      addToCart(product);
    });
  });
  let products = document.querySelectorAll(".product-card");
  products.forEach((product) => {
    product.addEventListener("click", (event) => {
      if (event.target.tagName.toLowerCase() !== "button") {
        let builder = new UserBuilder();
        builder.buildProductCardInfo(
          allProducts.find((p) => p._id == product.id)
        );
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
  showToast(`${product.name} har lagts till i varukorgen`);
};

const cartBtn = document.querySelector("[data-cart]");
const closeCartBtn = document.querySelector("[data-close-bar]");

let sidebar = document.querySelector("dialog[data-sidebar]");

let section = sidebar.querySelector("dialog[data-sidebar] section");

closeCartBtn.addEventListener("click", () => {
  sidebar.close();
});

cartBtn.addEventListener("click", () => {
  openCart(section, cart);
  sidebar.showModal();
});

sidebar.addEventListener("close", () => {
  section.innerHTML = "";
});

document.querySelector("#closeModal").addEventListener("click", () => {
  modal.close();
});

modal.addEventListener("close", () => {
  document.querySelector("#modalContent").innerHTML = "";
});

const proceedBtn = document.querySelector(".proceed-btn");
const orderForm = document.querySelector(".order-form");

const backtoCartBtn = document.querySelector(".back-to-cart-btn");
backtoCartBtn.addEventListener("click", () => {
  orderForm.classList.toggle("hidden");

  proceedBtn.classList.toggle("hidden");
});

if (proceedBtn) {
  proceedBtn.addEventListener("click", () => {
    orderForm.classList.toggle("hidden");

    proceedBtn.classList.toggle("hidden");
  });
}

const order = document.getElementById("order");
order.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(order);
  const data = Object.fromEntries(formData.entries());

  // Kartlägg form-fält till modellen
  const shippingAddress = {
    street: data.address,
    number: data.addressnumber,
    zipCode: data.postalcode,
    city: data.city,
  };

  // Hämta och omstrukturera cart från localStorage
  const rawCart = JSON.parse(localStorage.getItem("products")) || [];
  console.log(rawCart);
  const products = rawCart.map((item) => ({
    productId: item._id || item.productId, // beroende på hur det sparats
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  const payload = {
    firstname: data.firstname,
    lastname: data.lastname,
    phonenumber: data.phonenumber,
    email: data.email,
    shippingAddress,
    products,
  };

  console.log("Order som skickas:", payload);
  console.log("Produkter i order:", payload.products);

  try {
    const response = await fetch(
      "https://webshop-2025-be-g4.vercel.app/api/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) throw new Error("Kunde inte skicka ordern");

    const result = await response.json();
    console.log("Order skickad:", result);
    alert("Tack för din beställning!");

    // Rensa formulär och varukorg om du vill
    order.reset();
    localStorage.removeItem("products");
    cart.clearCart();
    section.innerHTML = "";
  } catch (error) {
    console.error("Fel vid order:", error);
    alert("Något gick fel. Försök igen.");
  }
});

function showToast(message) {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.background = "green";
  toast.style.color = "#fff";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "5px";
  toast.style.marginTop = "10px";
  toast.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";

  container.appendChild(toast);

  // Visa toast
  setTimeout(() => {
    toast.style.opacity = "1";
  }, 10);

  // Dölj och ta bort efter 3 sekunder
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}

const manageProductsBtn = document.querySelector("#manageProductsBtn");
