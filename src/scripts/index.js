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

// Global variable to store orders data
let ordersData = [];

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

    ordersData = orders || [];

    if (orders && orders.length > 0) {
      ordersDiv.innerHTML = "";
      orders.forEach((order) => {
        const orderStatus = order.status || "received";

        const firstname = order.firstname || "N/A";
        const lastname = order.lastname || "N/A";
        const email = order.email || "N/A";
        const totalPrice = order.totalPrice || 0;

        const totalItems = order.products
          ? order.products.reduce(
              (sum, product) => sum + (product.quantity || 1),
              0
            )
          : 0;

        const orderDate = order.createdAt
          ? new Date(order.createdAt).toLocaleString()
          : "N/A";

        const orderDiv = document.createElement("div");
        orderDiv.classList.add("order-item");
        orderDiv.innerHTML = `
          <div class="order-header">
            <div class="order-info">
              <h4>Order #${order._id.substring(order._id.length - 8)}</h4>
              <span class="order-date">${orderDate}</span>
            </div>
            <div class="order-status ${orderStatus}">${orderStatus}</div>
          </div>
          <div class="order-details">
            <div class="customer-info">
              <p><strong>Customer:</strong> ${firstname} ${lastname}</p>
              <p><strong>Email:</strong> ${email}</p>
            </div>
            <div class="order-summary">
              <p><strong>Total:</strong> $${totalPrice.toFixed(2)}</p>
              <p><strong>Items:</strong> ${totalItems}</p>
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

function viewOrderDetails(orderId) {
  try {
    const order = ordersData.find((o) => o._id === orderId);

    if (!order) {
      throw new Error("Order not found in the loaded data");
    }

    const modalContent = document.querySelector("#modalContent");
    if (!modalContent) return;

    modalContent.innerHTML = "";

    const orderStatus = order.status || "received";

    const firstname = order.firstname || "N/A";
    const lastname = order.lastname || "N/A";
    const email = order.email || "N/A";
    const phonenumber = order.phonenumber || "N/A";

    const shippingAddress = order.shippingAddress || {};
    const street = shippingAddress.street || "N/A";
    const number = shippingAddress.number || "";
    const zipCode = shippingAddress.zipCode || "N/A";
    const city = shippingAddress.city || "N/A";

    const products = order.products || [];

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString()
      : "N/A";

    const orderDetailsDiv = document.createElement("div");
    orderDetailsDiv.className = "order-details-modal";
    orderDetailsDiv.innerHTML = `
      <h3>Order Details</h3>
      <div class="order-info-section">
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Date:</strong> ${orderDate}</p>
        <p><strong>Status:</strong> <span class="status-badge ${orderStatus}">${orderStatus}</span></p>
      </div>
      
      <div class="customer-section">
        <h4>Customer Information</h4>
        <p><strong>Name:</strong> ${firstname} ${lastname}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phonenumber}</p>
      </div>
      
      <div class="shipping-section">
        <h4>Shipping Address</h4>
        <p>${street} ${number}</p>
        <p>${zipCode} ${city}</p>
      </div>
      
      <div class="products-section">
        <h4>Products</h4>
        <div class="order-products-list">
          ${products
            .map(
              (product) => `
            <div class="order-product-item">
              <div class="product-info">
                <span class="product-name">${
                  product.name || "Unknown Product"
                }</span>
                <span class="product-price">$${(product.price || 0).toFixed(
                  2
                )}</span>
              </div>
              <span class="product-quantity">x${product.quantity || 1}</span>
              <span class="product-total">$${(
                (product.price || 0) * (product.quantity || 1)
              ).toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      
      <div class="order-total-section">
        <p class="order-total"><strong>Total:</strong> $${(
          order.totalPrice || 0
        ).toFixed(2)}</p>
      </div>
      
      <div class="modal-actions">
        <button id="closeDetailsBtn" class="modal-btn">Close</button>
        <button id="editStatusBtn" class="modal-btn primary-btn" data-order-id="${
          order._id
        }">Update Status</button>
      </div>
    `;

    modalContent.appendChild(orderDetailsDiv);

    document.getElementById("closeDetailsBtn").addEventListener("click", () => {
      document.querySelector("#modal").close();
    });

    document.getElementById("editStatusBtn").addEventListener("click", () => {
      document.querySelector("#modal").close();
      updateOrderStatus(order._id);
    });

    document.querySelector("#modal").showModal();
  } catch (error) {
    console.error("Error displaying order details:", error);
    alert("Failed to load order details. " + error.message);
  }
}

function updateOrderStatus(orderId) {
  try {
    const order = ordersData.find((o) => o._id === orderId);

    if (!order) {
      throw new Error("Order not found in the loaded data");
    }

    console.log("Order for status update from stored data:", order); // Debugging log

    const modalContent = document.querySelector("#modalContent");
    if (!modalContent) return;

    modalContent.innerHTML = "";

    const currentStatus = order.status || "received";

    const firstname = order.firstname || "N/A";
    const lastname = order.lastname || "N/A";

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString()
      : "N/A";

    const statusUpdateDiv = document.createElement("div");
    statusUpdateDiv.className = "status-update-form";
    statusUpdateDiv.innerHTML = `
      <h3>Update Order Status</h3>
      <div class="order-summary-info">
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Customer:</strong> ${firstname} ${lastname}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Current Status:</strong> <span class="status-badge ${currentStatus}">${currentStatus}</span></p>
      </div>
      
      <form id="updateStatusForm">
        <div class="form-group">
          <label for="status">New Status:</label>
          <select id="status" name="status" required>
            <option value="received" ${
              currentStatus === "received" ? "selected" : ""
            }>Received</option>
            <option value="processing" ${
              currentStatus === "processing" ? "selected" : ""
            }>Processing</option>
            <option value="shipped" ${
              currentStatus === "shipped" ? "selected" : ""
            }>Shipped</option>
            <option value="delivered" ${
              currentStatus === "delivered" ? "selected" : ""
            }>Delivered</option>
            <option value="cancelled" ${
              currentStatus === "cancelled" ? "selected" : ""
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
            const updatedOrderIndex = ordersData.findIndex(
              (o) => o._id === orderId
            );
            if (updatedOrderIndex !== -1) {
              ordersData[updatedOrderIndex].status = newStatus;
            }

            document.querySelector("#modal").close();

            const successToast = document.createElement("div");
            successToast.className = "status-toast success";
            successToast.textContent = `Order status updated to "${newStatus}"`;
            document.body.appendChild(successToast);

            setTimeout(() => {
              successToast.remove();
            }, 3000);

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
    alert("Failed to load order data. " + error.message);
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
