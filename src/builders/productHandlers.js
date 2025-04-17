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
  const productCard = event.target.closest(".product-card");
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
  const productCard = event.target.closest(".product-card");
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
