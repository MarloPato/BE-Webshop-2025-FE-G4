import { deleteProduct, getProductById } from "../utils/api.js";
import { ProductFormBuilder } from "./ProductFormBuilder.js";

export function initProductHandlers() {
  document.addEventListener("click", function (event) {
    if (event.target && event.target.classList.contains("edit-product-btn")) {
      handleEditButtonClick(event);
    }

    if (event.target && event.target.classList.contains("delete-product-btn")) {
      handleDeleteButtonClick(event);
    }
  });
}

async function handleEditButtonClick(event) {
  const productCard = event.target.closest(".product-card-admin");
  if (!productCard) {
    console.error("Could not find product card");
    return;
  }

  const productId = productCard.id;
  if (!productId) {
    console.error("Product is missing ID");
    return;
  }

  const modalContent = document.querySelector("#modalContent");
  const modal = document.querySelector("#modal");
  if (!modalContent || !modal) {
    console.error("Modal elements are missing");
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
      .addNumberField("stock", "Stock:");

    await productForm.addCategoryField("category", "Category:");
    productForm
      .addTextField("imageUrl", "Image:")
      .addButton("createProductBtn", "Update product") // Changed from Swedish to English
      .render();

    productForm.populateWithProductData(product);

    modal.showModal();
  } catch (error) {
    console.error("Error fetching product data:", error);
    alert("An error occurred while fetching the product: " + error.message); // Changed from Swedish to English
  }
}

function handleDeleteButtonClick(event) {
  const productCard = event.target.closest(".product-card");
  if (!productCard) return;

  const productName = productCard.querySelector("h3")?.textContent || "product";
  const productId = productCard.id;

  const modalContent = document.querySelector("#modalContent");
  const modal = document.querySelector("#modal");
  if (!modalContent || !modal) return;

  modalContent.innerHTML = "";

  const confirmationDiv = document.createElement("div");
  confirmationDiv.className = "delete-confirmation";
  confirmationDiv.innerHTML = `
      <h2>Delete Product</h2>
      <p>Are you sure you want to delete the product "${productName}"?</p>
      <div class="confirmation-buttons">
        <button id="cancelDeleteBtn">No, cancel</button>
        <button id="confirmDeleteBtn">Yes, delete</button>
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
        location.reload(); // Reload page to show changes
      })
      .catch((error) => {
        console.error("Error deleting product:", error);
        alert("An error occurred when deleting the product"); // Changed from Swedish to English
      });
  });

  modal.showModal();
}
