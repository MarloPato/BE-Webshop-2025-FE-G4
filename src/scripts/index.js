import { fetchData, addProduct, deleteProduct, getBaseUrl } from "../utils/api.js";
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
});

const productsSideBarBtn = document.querySelector("#products");
const usersSideBarBtn = document.querySelector("#users");
const ordersSideBarBtn = document.querySelector("#orders");

productsSideBarBtn.addEventListener("click", () => {
  // loadProducts();
});


ordersSideBarBtn.addEventListener("click", async () => {
  const orders = await fetchData("orders");
  console.log(orders)
  const ordersDiv = document.getElementById("ordersAdmin");
  orders.forEach((order) => {
    const orderDiv = document.createElement("div");
    orderDiv.classList.add("order");
    orderDiv.innerHTML = `
      <p>Order ID: ${order._id}</p>
      <p>Totalprice: ${order.totalPrice}</p>
      <p>Status: ${order.status}</p>
    `;
    ordersDiv.appendChild(orderDiv);
  }
  );
});
const usersDiv = document.getElementById("usersAdmin")
usersSideBarBtn.addEventListener("click", () => {});


const modal = document.querySelector("#modal");

function updateNavigation() {
  const loginLink = document.querySelector('a[href="login.html"]');

  if (loginLink) {
    if (auth.isLoggedIn()) {
      loginLink.textContent = "Logga ut";
      loginLink.href = "#";

      // Ta bort eventuell befintlig lyssnare
      loginLink.removeEventListener("click", handleLogout);

      // Lägg till lyssnare för utloggning
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
  const productsContainer = document.getElementById("productsAdmin");
  productsContainer.innerHTML = "";

  if (products.length > 0) {
    let productBuilder = new Builder();
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
  const productsContainer = document.getElementById("productsAdmin");
  productsContainer.innerHTML = "<p>Loading products...</p>";

  try {
 
    const products = await fetchData();
    allProducts = products;
    updateProductsDisplay(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    productsContainer.innerHTML = "<p>Failed to load products.</p>";
  }
}

const renderProductCardEventListeners = (allProducts = []) => {
  let products = document.querySelectorAll(".product-card");
  products.forEach((product) => {
    product.addEventListener("click", (event) => {
      if (event.target.tagName.toLowerCase() !== "button") {
        let builder = new Builder();
        builder.buildProductCardInfo(
          allProducts.find((p) => p._id == product.id)
        );
        let productInfo = builder.build();
        let modalContent = document.querySelector("#modalContent");
        modalContent.append(productInfo[0]);
        modal.showModal();
      }
    });
  });
};

const manageProductsBtn = document.querySelector("#manageProductsBtn");
manageProductsBtn.addEventListener("click", () => {
  modal.showModal();
});

document.querySelector("#closeModal").addEventListener("click", () => {
  modal.close();
});

modal.addEventListener("close", () => {
  document.querySelector("#modalContent").innerHTML = "";
});

async function initAddProductButton() {
  let addProductBtn = document.querySelector("#manageProductsBtn");

  if (addProductBtn) {
    addProductBtn.addEventListener("click", async () => {
      modalContent.innerHTML = "";

      const productForm = new ProductFormBuilder("#modalContent");

      productForm
        .addTextField("name", "Name:")
        .addNumberField("price", "Price:")
        .addTextField("description", "Description:")
        .addNumberField("stock", "Stock:")

        await productForm.addCategoryField("category", "Category:")
        productForm
        .addTextField("imageUrl", "Image:")
        .addButton("createProductBtn", "Lägg till produkt")
        .render();
    });
  }
}

