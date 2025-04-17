import { addProduct, updateProduct } from "../utils/api.js";
import { Product } from "../classes/product.js";
import { fetchData } from "../utils/api.js";



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
    defaultOption.textContent = "Välj kategori";
    select.append(defaultOption);
    const categories = await fetchData("categories");
    console.log(categories);
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category._id;
      option.textContent = category.name;
      select.append(option);
    });
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
    this.form.querySelector("#name").value = product.name;
    this.form.querySelector("#price").value = product.price;
    this.form.querySelector("#description").value = product.description;
    this.form.querySelector("#stock").value = product.stock;
    this.form.querySelector("#imageUrl").value = product.imageUrl || "";

    // Ändra knapptexten
    this.form.querySelector("#createProductBtn").textContent = "Uppdatera produkt";

    // Spara produkt-ID för uppdatering
    this.form.dataset.productId = product.id || product._id || "";
    console.log("Set product ID in form dataset:", this.form.dataset.productId);

    return this;
  }

  async handleSubmit() {
    console.log("Form submitted, dataset:", this.form.dataset);

    let nameValue = document.querySelector("form#createProduct input#name").value;
    let priceValue = Number.parseFloat(document.querySelector("form#createProduct input#price").value);
    let descrValue = document.querySelector("form#createProduct input#description").value;
    let stockValue = Number.parseInt(document.querySelector("form#createProduct input#stock").value);
    let categoryValue = document.querySelector("form#createProduct select#category").value;
    let imageValue = document.querySelector("form#createProduct input#imageUrl").value || "";

    let product = new Product(nameValue, priceValue, descrValue, stockValue, categoryValue, imageValue);

    const productId = this.form.dataset.productId;
    console.log("Product ID from dataset:", productId);

    try {
      if (productId) {
        product._id = productId;
        console.log(product._id);
        await updateProduct("products", productId, product);
      } else {
        await addProduct("products", product);
      }

      modal.close();
      location.reload();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Ett fel uppstod när produkten skulle sparas");
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
