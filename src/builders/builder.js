export class Builder {
  constructor() {
    this.resultArr = [];
  }

  build() {
    return this.resultArr;
  }

  buildProductCardInfo(product) {
    let image = document.createElement("img");
    image.src = product.imageUrl;
    let name = document.createElement("h3");
    name.textContent = product.name;
    let price = document.createElement("p");
    price.textContent = product.price;
    let description = document.createElement("p");
    description.textContent = product.description;
    let info = document.createElement("article");
    info.classList.add("product-card");
    info.id = product._id ? product._id : "missing-id";
    info.append(image, name, price, description);
    this.resultArr.push(info);
  }

  buildProductCard(product) {
    const element = document.createElement("article");
    element.className = "product-card-admin";
    element.id = product._id ? product._id : "missing-id";
    element.innerHTML = `
        <h4>${product.name}</h4>
      `;
    let btnContainer = document.createElement("div");
    let editBtn = this.buildBtn("Edit", "edit-product-btn", `edit-product-${element.id}`);
    let deleteBtn = this.buildBtn("Delete", "delete-product-btn", `delete-product-${element.id}`);
    btnContainer.append(editBtn, deleteBtn);
    element.append(btnContainer);

    this.resultArr.push(element);
  }

  buildBtn(text = "", classname = "", id = "") {
    let button = document.createElement("button");
    button.textContent = text;
    classname === "" ? "" : button.classList.add(classname);
    id === "" ? "" : (button.id = id);
    return button;
  }

  buildCartInfo(cart) {
    let h4 = document.createElement("h4");
    h4.textContent = "In Cart";
    let ul = document.createElement("ul");
    cart.items.forEach((item) => {
      let li = document.createElement("li");
      li.textContent = `${item.name} - $${item.price.toFixed(2)}`;
      ul.append(li);
    });
    let total = document.createElement("h5");
    total.textContent = `Total: $${cart.getTotal().toFixed(2)}`;
    let div = document.createElement("div");
    div.append(h4, ul, total);
    if (cart.items.length > 0) {
      let clearButton = this.buildBtn("Töm varukorg", "clear-cart-btn");
      div.appendChild(clearButton);
    }

    this.resultArr.push(div);
  }
}
