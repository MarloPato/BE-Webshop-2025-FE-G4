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
import { fetchUsers, buildUsersList } from "../utils/userManagement.js";

document.addEventListener("DOMContentLoaded", () => {
  if (!auth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  loadProducts();
  updateNavigation();
  setupTabSwitching();
  loadCategories();

  setupUserFilter();
});

function setupTabSwitching() {
  const productsSideBarBtn = document.querySelector("#products");
  const usersSideBarBtn = document.querySelector("#users");
  const ordersSideBarBtn = document.querySelector("#orders");

  const productsContainer = document.querySelector(".container:nth-child(1)");
  const usersContainer = document.querySelector(".container:nth-child(2)");
  const ordersContainer = document.querySelector(".container:nth-child(3)");

  usersContainer.style.display = "none";
  ordersContainer.style.display = "none";

  productsSideBarBtn.classList.add("active");

  productsSideBarBtn.addEventListener("click", () => {
    productsContainer.style.display = "block";
    usersContainer.style.display = "none";
    ordersContainer.style.display = "none";

    productsSideBarBtn.classList.add("active");
    usersSideBarBtn.classList.remove("active");
    ordersSideBarBtn.classList.remove("active");

    const modal = document.querySelector("#modal");
    if (modal && modal.open) {
      modal.close();
    }

    loadProducts();
  });

  usersSideBarBtn.addEventListener("click", () => {
    productsContainer.style.display = "none";
    usersContainer.style.display = "block";
    ordersContainer.style.display = "none";

    productsSideBarBtn.classList.remove("active");
    usersSideBarBtn.classList.add("active");
    ordersSideBarBtn.classList.remove("active");

    const modal = document.querySelector("#modal");
    if (modal && modal.open) {
      modal.close();
    }

    loadUsers();
  });

  ordersSideBarBtn.addEventListener("click", async () => {
    productsContainer.style.display = "none";
    usersContainer.style.display = "none";
    ordersContainer.style.display = "block";

    productsSideBarBtn.classList.remove("active");
    usersSideBarBtn.classList.remove("active");
    ordersSideBarBtn.classList.add("active");

    const modal = document.querySelector("#modal");
    if (modal && modal.open) {
      modal.close();
    }

    loadOrders();
  });
}

function setupUserFilter() {
  const userFilter = document.getElementById("userFilter");
  if (userFilter) {
    userFilter.addEventListener("change", async () => {
      await loadUsers(userFilter.value);
    });
  }
}

async function loadUsers(filter = "") {
  const usersDiv = document.getElementById("usersAdmin");
  if (!usersDiv) return;

  usersDiv.innerHTML = "<p>Loading users...</p>";

  try {
    const users = await fetchUsers();

    if (!users || users.length === 0) {
      usersDiv.innerHTML = "<p>No users found</p>";
      return;
    }

    let filteredUsers = users;
    if (filter === "admin") {
      filteredUsers = users.filter((user) => user.isAdmin);
    } else if (filter === "customer") {
      filteredUsers = users.filter((user) => !user.isAdmin);
    }

    buildUsersList(filteredUsers, "usersAdmin");
  } catch (error) {
    console.error("Error loading users:", error);
    usersDiv.innerHTML = "<p>Error loading users: " + error.message + "</p>";
  }
}

async function loadOrders() {
  const ordersDiv = document.getElementById("ordersAdmin");
  if (!ordersDiv) return;

  ordersDiv.innerHTML = "<p>Loading orders...</p>";

  try {
    const orders = await fetchData("orders");

    if (orders && orders.length > 0) {
      ordersDiv.innerHTML = "";
      orders.forEach((order) => {
        const orderDiv = document.createElement("div");
        orderDiv.classList.add("order-item");
        orderDiv.innerHTML = `
          <div class="order-header">
            <div class="order-info">
              <h4>Order #${order._id.substring(order._id.length - 8)}</h4>
              <span class="order-date">${new Date(
                order.createdAt
              ).toLocaleString()}</span>
            </div>
            <div class="order-status ${order.status}">${order.status}</div>
          </div>
          <div class="order-details">
            <div class="customer-info">
              <p><strong>Customer:</strong> ${order.firstname} ${
          order.lastname
        }</p>
              <p><strong>Email:</strong> ${order.email}</p>
            </div>
            <div class="order-summary">
              <p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
            </div>
          </div>
          <div class="order-actions">
            <button class="view-order-btn" data-order-id="${
              order._id
            }">View Details</button>
            <button class="update-status-btn" data-order-id="${
              order._id
            }">Update Status</button>
          </div>
        `;
        ordersDiv.appendChild(orderDiv);
      });

      addOrderActionListeners();
    } else {
      ordersDiv.innerHTML = "<p>No orders found</p>";
    }
  } catch (error) {
    console.error("Error loading orders:", error);
    ordersDiv.innerHTML = "<p>Error loading orders</p>";
  }
}

function addOrderActionListeners() {
  document.querySelectorAll(".view-order-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const orderId = e.target.dataset.orderId;
      viewOrderDetails(orderId);
    });
  });

  document.querySelectorAll(".update-status-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const orderId = e.target.dataset.orderId;
      updateOrderStatus(orderId);
    });
  });
}

async function viewOrderDetails(orderId) {
  try {
    const order = await fetchData(`orders/${orderId}`);

    const modalContent = document.querySelector("#modalContent");
    if (!modalContent) return;

    modalContent.innerHTML = "";

    const orderDetailsDiv = document.createElement("div");
    orderDetailsDiv.className = "order-details-modal";
    orderDetailsDiv.innerHTML = `
      <h3>Order Details</h3>
      <div class="order-info-section">
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Date:</strong> ${new Date(
          order.createdAt
        ).toLocaleString()}</p>
        <p><strong>Status:</strong> <span class="status-badge ${
          order.status
        }">${order.status}</span></p>
      </div>
      
      <div class="customer-section">
        <h4>Customer Information</h4>
        <p><strong>Name:</strong> ${order.firstname} ${order.lastname}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Phone:</strong> ${order.phonenumber}</p>
      </div>
      
      <div class="shipping-section">
        <h4>Shipping Address</h4>
        <p>${order.shippingAddress.street} ${order.shippingAddress.number}</p>
        <p>${order.shippingAddress.zipCode} ${order.shippingAddress.city}</p>
      </div>
      
      <div class="products-section">
        <h4>Products</h4>
        <div class="order-products-list">
          ${order.products
            .map(
              (product) => `
            <div class="order-product-item">
              <div class="product-info">
                <span class="product-name">${product.name}</span>
                <span class="product-price">$${product.price.toFixed(2)}</span>
              </div>
              <span class="product-quantity">x${product.quantity}</span>
              <span class="product-total">$${(
                product.price * product.quantity
              ).toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      
      <div class="order-total-section">
        <p class="order-total"><strong>Total:</strong> $${order.totalPrice.toFixed(
          2
        )}</p>
      </div>
      
      <div class="modal-actions">
        <button id="closeDetailsBtn">Close</button>
      </div>
    `;

    modalContent.appendChild(orderDetailsDiv);

    document.getElementById("closeDetailsBtn").addEventListener("click", () => {
      document.querySelector("#modal").close();
    });

    document.querySelector("#modal").showModal();
  } catch (error) {
    console.error("Error fetching order details:", error);
    alert("Failed to load order details");
  }
}

async function updateOrderStatus(orderId) {
  try {
    const order = await fetchData(`orders/${orderId}`);

    const modalContent = document.querySelector("#modalContent");
    if (!modalContent) return;

    modalContent.innerHTML = "";

    const statusUpdateDiv = document.createElement("div");
    statusUpdateDiv.className = "status-update-form";
    statusUpdateDiv.innerHTML = `
      <h3>Update Order Status</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Current Status:</strong> <span class="status-badge ${
        order.status
      }">${order.status}</span></p>
      
      <form id="updateStatusForm">
        <div class="form-group">
          <label for="status">New Status:</label>
          <select id="status" name="status" required>
            <option value="received" ${
              order.status === "received" ? "selected" : ""
            }>Received</option>
            <option value="processing" ${
              order.status === "processing" ? "selected" : ""
            }>Processing</option>
            <option value="shipped" ${
              order.status === "shipped" ? "selected" : ""
            }>Shipped</option>
            <option value="delivered" ${
              order.status === "delivered" ? "selected" : ""
            }>Delivered</option>
            <option value="cancelled" ${
              order.status === "cancelled" ? "selected" : ""
            }>Cancelled</option>
          </select>
        </div>
        
        <div class="form-actions">
          <button type="button" id="cancelUpdateBtn">Cancel</button>
          <button type="submit" id="confirmUpdateBtn">Update Status</button>
        </div>
      </form>
    `;

    modalContent.appendChild(statusUpdateDiv);

    document.getElementById("cancelUpdateBtn").addEventListener("click", () => {
      document.querySelector("#modal").close();
    });

    document
      .getElementById("updateStatusForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const newStatus = document.getElementById("status").value;

        try {
          const token = auth.getToken();

          const response = await axios({
            method: "put",
            url: `${getBaseUrl()}orders/${orderId}`,
            data: { status: newStatus },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.status === 200) {
            document.querySelector("#modal").close();
            loadOrders(); // Refresh orders list
          } else {
            throw new Error("Failed to update order status");
          }
        } catch (error) {
          console.error("Error updating order status:", error);
          alert("Failed to update order status");
        }
      });

    document.querySelector("#modal").showModal();
  } catch (error) {
    console.error("Error preparing status update:", error);
    alert("Failed to load order data");
  }
}

const modal = document.querySelector("#modal");

function updateNavigation() {
  const loginLink = document.querySelector('a[href="login.html"]');

  if (loginLink) {
    if (auth.isLoggedIn()) {
      loginLink.textContent = "Logout";
      loginLink.href = "#";

      loginLink.removeEventListener("click", handleLogout);
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
        while (categoryFilter.options.length > 1) {
          categoryFilter.remove(1);
        }

        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.name;
          option.textContent =
            category.name.charAt(0).toUpperCase() + category.name.slice(1);
          categoryFilter.appendChild(option);
        });

        categoryFilter.removeEventListener("change", handleCategoryFilter);

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
      products = await fetchData("products");
    } else {
      const response = await axios.get(
        `${getBaseUrl()}products/bycategory?category=${selectedCategory}`
      );
      products = response.status === 200 ? response.data : [];
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

    initAddProductButton();
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

    products.forEach((product, index) => {
      productBuilder.buildProductCard(product);
      const productCards = productBuilder.build();
      productsContainer.append(productCards[index]);
    });

    initProductHandlers();
  } else {
    productsContainer.innerHTML =
      "<p>No products available for this category.</p>";
  }
}

if (modal) {
  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.close();
    }
  });

  const closeModalBtn = document.querySelector("#closeModal");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      modal.close();
    });
  }

  modal.addEventListener("close", () => {
    const modalContent = document.querySelector("#modalContent");
    if (modalContent) {
      modalContent.innerHTML = "";
    }
  });
}

function initAddProductButton() {
  let addProductBtn = document.querySelector("#manageProductsBtn");

  if (addProductBtn) {
    const newBtn = addProductBtn.cloneNode(true);
    if (addProductBtn.parentNode) {
      addProductBtn.parentNode.replaceChild(newBtn, addProductBtn);
    }
    addProductBtn = newBtn;

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
