import { addProduct, updateProduct, fetchData } from "../utils/api.js";
import { Product } from "../classes/product.js";
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

  async addCategoryField(id, label) {
    const labelElement = document.createElement("label");
    labelElement.setAttribute("for", id);
    labelElement.textContent = label;

    const select = document.createElement("select");
    select.id = id;
    select.name = id;
    select.required = true;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select category"; // Changed from Swedish to English
    select.append(defaultOption);

    try {
      const categories = await fetchData("categories");
      console.log("Categories loaded:", categories);

      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category._id;
        option.textContent = category.name;
        select.append(option);
      });
    } catch (error) {
      console.error("Error loading categories:", error);
    }

    this.form.append(labelElement);
    this.form.append(select);
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

    // Set category value if product has category
    const categorySelect = this.form.querySelector("#category");
    if (categorySelect && product.category) {
      const categoryId =
        typeof product.category === "object"
          ? product.category._id
          : product.category;
      categorySelect.value = categoryId;
    }

    // Change button text
    const submitBtn = this.form.querySelector("#createProductBtn");
    if (submitBtn) {
      submitBtn.textContent = "Update product"; // Changed from Swedish to English
    }

    // Store product ID for update
    this.form.dataset.productId = product._id || "";
    console.log("Set product ID in form dataset:", this.form.dataset.productId);

    return this;
  }

  async handleSubmit() {
    console.log("Form submitted, dataset:", this.form.dataset);

    try {
      // Get form data
      const name = this.form.querySelector("#name").value;
      const price = parseFloat(this.form.querySelector("#price").value);
      const description = this.form.querySelector("#description").value;
      const stock = parseInt(this.form.querySelector("#stock").value);
      const category = this.form.querySelector("#category").value;
      const imageUrl =
        this.form.querySelector("#imageUrl").value ||
        "https://picsum.photos/200";

      // Create product object
      const productData = {
        name,
        price,
        description,
        stock,
        category,
        imageUrl,
      };

      console.log("Product data to submit:", productData);

      // Get the token
      const token = auth.getToken();
      if (!token) {
        throw new Error("You must be logged in to perform this action");
      }

      // Get product ID if updating
      const productId = this.form.dataset.productId;
      console.log("Product ID for update:", productId);

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
      const modal = document.querySelector("#modal");
      if (modal) {
        modal.close();
      }

      // Reload the page to show updated products
      window.location.reload();
    } catch (error) {
      console.error("Error saving product:", error);

      let errorMessage = "An error occurred when saving the product"; // Changed from Swedish to English

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
          .addButton("createProductBtn", "Add product") // Changed from Swedish to English
          .render();

        const modal = document.querySelector("#modal");
        if (modal) {
          modal.showModal();
        }
      }
    });
  }
}
