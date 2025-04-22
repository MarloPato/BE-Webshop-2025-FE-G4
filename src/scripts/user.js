import { UserBuilder } from "../builders/userBuilder.js";
import { fetchData, getBaseUrl } from "../utils/api.js";
import { Cart } from "../classes/cart.js";
import { LocalStorage, CART_KEY } from "../utils/localstorage.js";
import { Builder } from "../builders/builder.js";
import { auth } from "../utils/auth.js";

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadCategories();
  updateUI();
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

function updateUI() {
  // Update login/logout link
  const loginLink = document.querySelector('.nav-links a[href="login.html"]');
  if (loginLink) {
    if (auth.isLoggedIn()) {
      loginLink.textContent = "Logout";
      loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        auth.logout();
        window.location.href = "index.html";
      });
    } else {
      loginLink.textContent = "Login";
    }
  }
}

let allProducts = [];

async function loadCategories() {
  try {
    const response = await axios.get(`${getBaseUrl()}categories`);

    if (response.status === 200) {
      const categories = response.data;
      const categoryButtonsContainer =
        document.getElementById("categoryButtons");

      if (categoryButtonsContainer) {
        // Create "All Categories" button
        const allCategoriesBtn = document.createElement("button");
        allCategoriesBtn.classList.add(
          "category-btn",
          "all-categories-btn",
          "active"
        );
        allCategoriesBtn.textContent = "All Categories";
        allCategoriesBtn.dataset.category = "";
        categoryButtonsContainer.appendChild(allCategoriesBtn);

        // Create buttons for each category
        categories.forEach((category) => {
          const categoryBtn = document.createElement("button");
          categoryBtn.classList.add("category-btn");
          categoryBtn.textContent =
            category.name.charAt(0).toUpperCase() + category.name.slice(1); // Capitalize first letter
          categoryBtn.dataset.category = category.name;
          categoryButtonsContainer.appendChild(categoryBtn);
        });

        const categoryButtons = document.querySelectorAll(".category-btn");
        categoryButtons.forEach((btn) => {
          btn.addEventListener("click", () => {
            categoryButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            filterProductsByCategory(btn.dataset.category);
          });
        });
      }
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

async function filterProductsByCategory(category) {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "<p>Loading products...</p>";

  try {
    let products;

    if (!category) {
      products = await fetchData("products");
      console.log("All products loaded:", products);
    } else {
      console.log("Filtering by category:", category);
      const response = await axios.get(
        `${getBaseUrl()}products/bycategory?category=${category}`
      );
      products = response.status === 200 ? response.data : [];
      console.log("Filtered products:", products);
    }

    allProducts = products;
    updateProductsDisplay(products);
  } catch (error) {
    console.error("Error loading products:", error);
    productsContainer.innerHTML = "<p>Error loading products.</p>";
  }
}

function updateProductsDisplay(products) {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "";

  if (products && products.length > 0) {
    let productBuilder = new UserBuilder();
    for (let x = 0; x < products.length; x++) {
      productBuilder.buildProductCard(products[x]);
      let productCards = productBuilder.build();
      productsContainer.append(productCards[x]);
    }
    renderProductCardEventListeners(products);
  } else {
    productsContainer.innerHTML =
      "<p>No products available for this category.</p>";
  }
}

async function loadProducts() {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "<p>Loading products...</p>";

  try {
    const products = await fetchData("products");
    console.log("Initial products loaded:", products.length);
    allProducts = products;
    updateProductsDisplay(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    productsContainer.innerHTML = "<p>Failed to load products.</p>";
  }
}

const renderProductCardEventListeners = (products = []) => {
  let addProductBtns = document.querySelectorAll(".add-to-cart-btn");
  addProductBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      let product = products.find(
        (p) => p._id == btn.id.substring(btn.id.lastIndexOf("-") + 1)
      );
      if (product) {
        addToCart(product);
      }
    });
  });

  let productCards = document.querySelectorAll(".product-card");
  productCards.forEach((product) => {
    product.addEventListener("click", (event) => {
      if (event.target.tagName.toLowerCase() !== "button") {
        let builder = new UserBuilder();
        const foundProduct = products.find((p) => p._id == product.id);
        if (foundProduct) {
          builder.buildProductCardInfo(foundProduct);
          let productInfo = builder.build();
          let modalContent = document.querySelector("#modalContent");
          modalContent.innerHTML = "";
          modalContent.append(productInfo[0]);
          modal.showModal();
          let addToCartBtn = modalContent.querySelector(".add-to-cart-btn");
          if (addToCartBtn) {
            addToCartBtn.addEventListener("click", () => {
              addToCart(foundProduct);
            });
          }
        }
      }
    });
  });
};

const openCart = (parentElement, userCart) => {
  let builder = new UserBuilder();
  builder.buildCartInfo(userCart);
  let child = builder.build();
  parentElement.innerHTML = "";
  child.forEach((c) => parentElement.append(c));

  // Add event listeners for the clear cart button
  const clearButton = parentElement.querySelector(".clear-cart-btn");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      userCart.clearCart();
      LocalStorage.clearStorage(CART_KEY);
      parentElement.innerHTML =
        "<p style='text-align: center; margin: 20px 10px;'>" +
        "<span style='font-size: 1.5em; margin-right: 10px;'>🗑️</span>" +
        "Your cart has been cleared.</p>";
    });
  }

  const incrementButtons = parentElement.querySelectorAll(".increment-btn");
  incrementButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.productId;
      const product = allProducts.find((p) => p._id === productId);

      if (product) {
        cart.addItem(product);
      } else {
        const existingItem = cart.items.find(
          (item) => item._id === productId || item.productId === productId
        );
        if (existingItem) {
          cart.incrementItem(productId);
        }
      }

      cart.updateCart();
      LocalStorage.saveToStorage(CART_KEY, product || existingItem);
      openCart(parentElement, cart);
    });
  });

  const decrementButtons = parentElement.querySelectorAll(".decrement-btn");
  decrementButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.productId;

      cart.decrementItem(productId);
      cart.updateCart();

      const cartItems = LocalStorage.getStorageAsJSON(CART_KEY) || [];
      const updatedItems = [...cartItems];

      const indexToRemove = updatedItems.findIndex(
        (item) => item._id === productId || item.productId === productId
      );

      if (indexToRemove !== -1) {
        updatedItems.splice(indexToRemove, 1);
        localStorage.setItem(CART_KEY, JSON.stringify(updatedItems));
      }
      openCart(parentElement, cart);
    });
  });
};

const addToCart = (product) => {
  cart.addItem(product);
  cart.updateCart();
  LocalStorage.saveToStorage(CART_KEY, product);
  showToast(`${product.name} has been added to your cart`);
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

if (backtoCartBtn) {
  backtoCartBtn.addEventListener("click", () => {
    orderForm.classList.toggle("hidden");
    proceedBtn.classList.toggle("hidden");
  });
}

if (proceedBtn) {
  proceedBtn.addEventListener("click", () => {
    orderForm.classList.toggle("hidden");
    proceedBtn.classList.toggle("hidden");
  });
}

const order = document.getElementById("order");
if (order) {
  order.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(order);
    const data = Object.fromEntries(formData.entries());

    const shippingAddress = {
      street: data.address,
      number: data.addressnumber,
      zipCode: data.postalcode,
      city: data.city,
    };

    const rawCart = JSON.parse(localStorage.getItem("products")) || [];
    const products = rawCart.map((item) => ({
      productId: item._id || item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
    }));

    const payload = {
      firstname: data.firstname,
      lastname: data.lastname,
      phonenumber: data.phonenumber,
      email: data.email,
      shippingAddress,
      products,
    };

    console.log("Order payload:", payload);

    try {
      const token = auth.getToken();

      const response = await fetch(`${getBaseUrl()}orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Could not send order");

      const result = await response.json();
      console.log("Order sent:", result);
      showToast("Thank you for your order!");

      order.reset();
      localStorage.removeItem("products");
      cart.clearCart();
      cart.updateCart();
      section.innerHTML = "";
      sidebar.close();
    } catch (error) {
      console.error("Error placing order:", error);
      showToast("Something went wrong. Please try again.");
    }
  });
}

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

  // Show toast
  setTimeout(() => {
    toast.style.opacity = "1";
  }, 10);

  // Hide and remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}
