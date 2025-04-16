import { auth } from "../utils/auth.js";
import { getBaseUrl } from "../utils/api.js";

export class ProductFormBuilder {
  constructor(targetSelector) {
    this.targetElement = document.querySelector(targetSelector);
    this.form = document.createElement("form");
    this.form.id = "createProduct";

    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  }

  addTextField(id, label, required = true) {
    const labelElement = document.createElement("label");
    labelElement.setAttribute("for", id);
    labelElement.textContent = label;

    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.name = id;
    if (required) {
      input.required = true;
    }

    this.form.append(labelElement);
    this.form.append(input);

    return this;
  }

  addNumberField(id, label, required = true) {
    const labelElement = document.createElement("label");
    labelElement.setAttribute("for", id);
    labelElement.textContent = label;

    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.step = 0.01;
    input.id = id;
    input.name = id;
    if (required) {
      input.required = true;
    }

    this.form.append(labelElement);
    this.form.append(input);

    return this;
  }

  addButton(id, text, type = "submit") {
    const button = document.createElement("button");
    button.id = id;
    button.type = type;
    button.textContent = text;

    this.form.append(button);

    return this;
  }

  populateWithProductData(product) {
    console.log("Populating form with product data:", product);

    this.form.querySelector("#name").value = product.name || "";
    this.form.querySelector("#price").value = product.price || 0;
    this.form.querySelector("#description").value = product.description || "";
    this.form.querySelector("#stock").value = product.stock || 0;
    this.form.querySelector("#imageUrl").value = product.imageUrl || "";

    // Change button text
    this.form.querySelector("#createProductBtn").textContent =
      "Uppdatera produkt";

    // Store product ID for update
    this.form.dataset.productId = product._id || "";
    console.log("Set product ID in form dataset:", this.form.dataset.productId);

    return this;
  }

  async handleSubmit() {
    console.log("Form submitted");

    try {
      // Get form data
      const name = this.form.querySelector("#name").value;
      const price = parseFloat(this.form.querySelector("#price").value);
      const description = this.form.querySelector("#description").value;
      const stock = parseInt(this.form.querySelector("#stock").value);
      const imageUrl =
        this.form.querySelector("#imageUrl").value ||
        "https://picsum.photos/200";

      // Create product object
      const productData = {
        name,
        price,
        description,
        stock,
        imageUrl,
      };

      console.log("Product data to submit:", productData);

      // Get the token
      const token = auth.getToken();

      // Get product ID if updating
      const productId = this.form.dataset.productId;

      let response;

      if (productId) {
        // Updating existing product
        console.log("Updating product with ID:", productId);
        const url = `${getBaseUrl()}products/${productId}`;

        response = await axios({
          method: "put",
          url: url,
          data: productData,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        // Creating new product
        console.log("Creating new product");
        const url = `${getBaseUrl()}products`;

        response = await axios({
          method: "post",
          url: url,
          data: productData,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      console.log("API response:", response);

      // Success - close modal and reload
      modal.close();
      window.location.reload();
    } catch (error) {
      console.error("Error saving product:", error);

      let errorMessage = "Ett fel uppstod när produkten skulle sparas";

      // Get more detailed error info if available
      if (error.response && error.response.data) {
        errorMessage += ": " + (error.response.data.error || error.message);
      } else if (error.message) {
        errorMessage += ": " + error.message;
      }

      alert(errorMessage);
    }
  }

  render() {
    if (this.targetElement) {
      this.targetElement.append(this.form);
    } else {
      console.error("Target element not found");
    }
  }
}

export function initAddProductButton() {
  let addProductBtn = document.querySelector("#manageProductsBtn");

  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      modalContent.innerHTML = "";

      const productForm = new ProductFormBuilder("#modalContent");

      productForm
        .addTextField("name", "Name:")
        .addNumberField("price", "Price:")
        .addTextField("description", "Description:")
        .addNumberField("stock", "Stock:")
        .addTextField("imageUrl", "Image:")
        .addButton("createProductBtn", "Lägg till produkt")
        .render();
    });
  }
}
