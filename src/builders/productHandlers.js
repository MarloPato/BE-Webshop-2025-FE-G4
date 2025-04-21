import { deleteProduct, getProductById, getBaseUrl } from "../utils/api.js";
import { ProductFormBuilder } from "./ProductFormBuilder.js";
import { auth } from "../utils/auth.js";

export function initProductHandlers() {
  document.addEventListener("click", function (event) {
    if (event.target && event.target.classList.contains("edit-product-btn")) {
      handleEditButtonClick(event);
    }

    if (event.target && event.target.classList.contains("delete-product-btn")) {
      handleDeleteButtonClick(event);
    }

    if (event.target && event.target.classList.contains("edit-order-btn")) {
      editOrders(event);
    }

    if (event.target && event.target.classList.contains("edit-category-btn")) {
      editCategories(event);
    }
  });
}

async function editCategories(event) {
  const modal = document.querySelector("#modal");
  const modalContent = document.querySelector("#modalContent");

  if (!modal || !modalContent) {
    console.error("Modal-element saknas");
    return;
  }

  // Töm modalinnehållet först
  modalContent.innerHTML = "";

  const category = event.target.closest(".category");
  if (!category || !category.id) {
    console.error("Kategori eller kategori-ID saknas");
    return;
  }

  console.log("Kategori ID:", category.id);

  // Skapa label och select-element
  const label = document.createElement("label");
  label.setAttribute("for", "categoryName");
  label.textContent = "Category Name:";

  const input = document.createElement("input");
  input.id = "categoryName";
  input.name = "categoryName";
  input.type = "text";

  // Skapa Update-knappen
  const updateBtn = document.createElement("button");
  updateBtn.id = "updateCategoryBtn";
  updateBtn.textContent = "Update Category";
  updateBtn.addEventListener("click", async () => {
    const selectedCategoryName = input.value;
    try {
      const response = await fetch(`${getBaseUrl()}categories/${category.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.getToken()}`,
        },
        body: JSON.stringify({ name: selectedCategoryName }),
      });

      if (response.ok) {
        const updatedCategory = await response.json();
        console.log("Category updated:", updatedCategory);
        modal.close();
        location.reload();
      } else {
        console.error("Failed to update category:", response.statusText);
        alert("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Error updating category");
    }
  });

  // Skapa Cancel-knappen
  const cancelBtn = document.createElement("button");
  cancelBtn.id = "cancelCategoryBtn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => {
    modal.close();
  });

  // Lägg till alla element i modalinnehållet
  modalContent.appendChild(label);
  modalContent.appendChild(input);
  modalContent.appendChild(updateBtn);
  modalContent.appendChild(cancelBtn);
  
}

async function editOrders(event) {
  const modal = document.querySelector("#modal");
  const modalContent = document.querySelector("#modalContent");

  if (!modal || !modalContent) {
    console.error("Modal-element saknas");
    return;
  }

  // Töm modalinnehållet först
  modalContent.innerHTML = "";

  const order = event.target.closest(".order");
  if (!order || !order.id) {
    console.error("Order eller order-ID saknas");
    return;
  }

  console.log("Order ID:", order.id);

  // Skapa label och select-element
  const label = document.createElement("label");
  label.setAttribute("for", "orderStatus");
  label.textContent = "Order Status:";

  const select = document.createElement("select");
  select.id = "orderStatus";
  select.name = "orderStatus";

  const statuses = ["received", "processing", "shipped", "delivered", "cancelled"];
  statuses.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    select.appendChild(option);
  });

  // Skapa Update-knappen
  const updateBtn = document.createElement("button");
  updateBtn.id = "updateOrderBtn";
  updateBtn.textContent = "Update Order";
  updateBtn.addEventListener("click", async () => {
    const selectedStatus = select.value;
    try {
      const response = await fetch(`${getBaseUrl()}orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.getToken()}`,
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        console.log("Order updated:", updatedOrder);
        modal.close();
        location.reload();
      } else {
        console.error("Failed to update order:", response.statusText);
        alert("Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order");
    }
  });

  // Skapa Cancel-knappen
  const cancelBtn = document.createElement("button");
  cancelBtn.id = "cancelOrderBtn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => {
    modal.close();
  });

  // Lägg till alla element i modalinnehållet
  modalContent.appendChild(label);
  modalContent.appendChild(select);
  modalContent.appendChild(updateBtn);
  modalContent.appendChild(cancelBtn);

  // Visa modalen
  modal.showModal();
}


async function handleEditButtonClick(event) {
  const productCard = event.target.closest(".product-card-admin");
  if (!productCard) {
    console.error("Kunde inte hitta produktkortet");
    return;
  }

  const productId = productCard.id;
  if (!productId) {
    console.error("Produkten saknar ID");
    return;
  }

  const modalContent = document.querySelector("#modalContent");
  const modal = document.querySelector("#modal");
  if (!modalContent || !modal) {
    console.error("Modal-element saknas");
    return;
  }

  modalContent.innerHTML = "";

  try {
    const product = await getProductById("products", productId);

    if (!product) {
      throw new Error(`No product found with ID: ${productId}`);
    }

    console.log("Retrieved product:", product);

    const productForm = new ProductFormBuilder("#modalContent");

    productForm
      .addTextField("name", "Name:")
      .addNumberField("price", "Price:")
      .addTextField("description", "Description:")
      .addNumberField("stock", "Stock:")

      await productForm.addCategoryField("category", "Category:")
      productForm
      .addTextField("imageUrl", "Image:")
      .addButton("createProductBtn", "Uppdatera produkt")
      .render();

    productForm.populateWithProductData(product);

    modal.showModal();
  } catch (error) {
    console.error("Error fetching product data:", error);
    alert("Ett fel uppstod när produkten skulle hämtas: " + error.message);
  }
}

function handleDeleteButtonClick(event) {
  console.log("Delete button clicked");
  console.log(event);
  const productCard = event.target.closest(".product-card-admin");

  console.log(productCard)
  if (!productCard) return;

  const productName = productCard.querySelector("h3")?.textContent || "produkt";
  const productId = productCard.id;

  const modalContent = document.querySelector("#modalContent");
  const modal = document.querySelector("#modal");
  if (!modalContent || !modal) return;

  modalContent.innerHTML = "";

  const confirmationDiv = document.createElement("div");
  confirmationDiv.className = "delete-confirmation";
  confirmationDiv.innerHTML = `
      <h2>Radera produkt</h2>
      <p>Är du säker att du vill radera produkten "${productName}"?</p>
      <div class="confirmation-buttons">
        <button id="cancelDeleteBtn">Nej, avbryt</button>
        <button id="confirmDeleteBtn">Ja, radera</button>
      </div>
    `;

  modalContent.appendChild(confirmationDiv);

  document.getElementById("cancelDeleteBtn")?.addEventListener("click", () => {
    modal.close();
  });

  document.getElementById("confirmDeleteBtn")?.addEventListener("click", () => {
    deleteProduct("products", productId)
      .then(() => {
        modal.close();
        location.reload(); // Ladda om sidan för att visa ändringarna
      })
      .catch((error) => {
        console.error("Error deleting product:", error);
        alert("Ett fel uppstod när produkten skulle tas bort");
      });
  });

  modal.showModal();
}
