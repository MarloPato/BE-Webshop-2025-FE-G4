import {
  fetchData,
  addProduct,
  deleteProduct,
  getBaseUrl,
} from "../utils/api.js";
import { Product } from "../classes/product.js";
import { Builder } from "../builders/builder.js";
import { auth } from "../utils/auth.js";
import { ProductFormBuilder } from "../builders/ProductFormBuilder.js";
import { initProductHandlers } from "../builders/productHandlers.js";

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateNavigation();
  initAddProductButton();
  initProductHandlers();
  loadCategories();
  setupTabSwitching();
});

function setupTabSwitching() {
  const productsSideBarBtn = document.querySelector("#products");
  const usersSideBarBtn = document.querySelector("#users");
  const ordersSideBarBtn = document.querySelector("#orders");

  const productsContainer = document.querySelector(".container:nth-child(1)");
  const usersContainer = document.querySelector(".container:nth-child(2)");
  const ordersContainer = document.querySelector(".container:nth-child(3)");

  // Hide all except products initially
  usersContainer.style.display = "none";
  ordersContainer.style.display = "none";

  productsSideBarBtn.addEventListener("click", () => {
    productsContainer.style.display = "block";
    usersContainer.style.display = "none";
    ordersContainer.style.display = "none";
    loadProducts();
  });

  usersSideBarBtn.addEventListener("click", () => {
    productsContainer.style.display = "none";
    usersContainer.style.display = "block";
    ordersContainer.style.display = "none";
    // Load users function would go here
  });

  ordersSideBarBtn.addEventListener("click", async () => {
    productsContainer.style.display = "none";
    usersContainer.style.display = "none";
    ordersContainer.style.display = "block";

    // Load orders
    const ordersDiv = document.getElementById("ordersAdmin");
    ordersDiv.innerHTML = "<p>Loading orders...</p>";

    try {
      const orders = await fetchData("orders");
      console.log(orders);

      if (orders && orders.length > 0) {
        ordersDiv.innerHTML = "";
        orders.forEach((order) => {
          const orderDiv = document.createElement("div");
          orderDiv.classList.add("order");
          orderDiv.innerHTML = `
            <p>Order ID: ${order._id}</p>
            <p>Total price: ${order.totalPrice}</p>
            <p>Status: ${order.status}</p>
          `;
          ordersDiv.appendChild(orderDiv);
        });
      } else {
        ordersDiv.innerHTML = "<p>No orders found</p>";
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      ordersDiv.innerHTML = "<p>Error loading orders</p>";
    }
  });
}

const modal = document.querySelector("#modal");

function updateNavigation() {
  const loginLink = document.querySelector('a[href="login.html"]');

  if (loginLink) {
    if (auth.isLoggedIn()) {
      loginLink.textContent = "Logout";
      loginLink.href = "#";

      // Remove any existing listener
      loginLink.removeEventListener("click", handleLogout);

      // Add logout listener
      loginLink.addEventListener("click", handleLogout);
    } else {
      loginLink.textContent = "Login";
      loginLink.href = "login.html";
    }
  }
}

function handleLogout(e) {
  e.preventDefault();
  auth.logout();
  window.location.href = "index.html";
}

let allProducts = [];

async function loadCategories() {
  try {
    const response = await axios.get(`${getBaseUrl()}categories`);

    if (response.status === 200) {
      const categories = response.data;
      const categoryFilter = document.getElementById("categoryFilter");

      if (categoryFilter) {
        // Clear existing options except the first one
        while (categoryFilter.options.length > 1) {
          categoryFilter.remove(1);
        }

        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.name;
          option.textContent =
            category.name.charAt(0).toUpperCase() + category.name.slice(1); // Capitalize first letter
          categoryFilter.appendChild(option);
        });

        categoryFilter.addEventListener("change", handleCategoryFilter);
      }
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

async function handleCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter");
  const selectedCategory = categoryFilter.value;
  const productsContainer = document.getElementById("productsAdmin");
  productsContainer.innerHTML = "<p>Loading products...</p>";

  try {
    let products;

    if (selectedCategory === "") {
      // Empty selection = All Categories
      products = await fetchData("products");
      console.log("All products loaded:", products);
    } else {
      // Specific category selected
      console.log("Filtering by category:", selectedCategory);
      const response = await axios.get(
        `${getBaseUrl()}products/bycategory?category=${selectedCategory}`
      );
      products = response.status === 200 ? response.data : [];
      console.log("Filtered products:", products);
    }

    allProducts = products;
    updateProductsDisplay(products);
  } catch (error) {
    console.error("Error filtering products:", error);
    productsContainer.innerHTML = "<p>Error loading products.</p>";
  }
}

async function loadProducts() {
  const productsContainer = document.getElementById("productsAdmin");
  productsContainer.innerHTML = "<p>Loading products...</p>";

  try {
    const products = await fetchData("products");
    allProducts = products;
    updateProductsDisplay(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    productsContainer.innerHTML = "<p>Failed to load products.</p>";
  }
}

function updateProductsDisplay(products) {
  const productsContainer = document.getElementById("productsAdmin");
  productsContainer.innerHTML = "";

  if (products && products.length > 0) {
    let productBuilder = new Builder();
    for (let x = 0; x < products.length; x++) {
      productBuilder.buildProductCard(products[x]);
      let productCards = productBuilder.build();
      productsContainer.append(productCards[x]);
    }
    initProductHandlers();
  } else {
    productsContainer.innerHTML =
      "<p>No products available for this category.</p>";
  }
}

document.querySelector("#closeModal").addEventListener("click", () => {
  modal.close();
});

modal.addEventListener("close", () => {
  document.querySelector("#modalContent").innerHTML = "";
});

async function initAddProductButton() {
  let addProductBtn = document.querySelector("#manageProductsBtn");

  if (addProductBtn) {
    // Update button text to English
    addProductBtn.textContent = "Create a product";

    addProductBtn.addEventListener("click", async () => {
      const modalContent = document.querySelector("#modalContent");
      if (modalContent) {
        modalContent.innerHTML = "";

        const productForm = new ProductFormBuilder("#modalContent");

        productForm
          .addTextField("name", "Name:")
          .addNumberField("price", "Price:")
          .addTextField("description", "Description:")
          .addNumberField("stock", "Stock:");

        await productForm.addCategoryField("category", "Category:");

        productForm
          .addTextField("imageUrl", "Image URL:")
          .addButton("createProductBtn", "Add product")
          .render();

        const modal = document.querySelector("#modal");
        if (modal) {
          modal.showModal();
        }
      }
    });
  }
}
