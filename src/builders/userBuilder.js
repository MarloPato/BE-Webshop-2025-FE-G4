export class UserBuilder {
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
    element.className = "product-card";
    element.id = product._id ? product._id : "missing-id";
    element.innerHTML = `
          <img src="${product.imageUrl}" class="product-image" alt="${
      product.name
    }" />
          <h3>${product.name}</h3>
          <p>$${product.price.toFixed(2)}</p>
        `;
    let btnContainer = document.createElement("div");
    let addToCartBtn = this.buildBtn(
      "Add To Cart",
      "add-to-cart-btn",
      `add-to-cart-${element.id}`
    );
    btnContainer.append(addToCartBtn);
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
    ul.classList.add("cart-items-list");
    const groupedItems = {};

    cart.items.forEach((item) => {
      const productId = item._id || item.productId;
      const name = item.name;

      if (!groupedItems[productId]) {
        groupedItems[productId] = {
          ...item,
          productId: productId,
          quantity: 1,
        };
      } else {
        groupedItems[productId].quantity += 1;
      }
    });

    Object.values(groupedItems).forEach((item) => {
      let li = document.createElement("li");
      li.classList.add("cart-item");
      li.dataset.productId = item.productId;

      let itemDetails = document.createElement("div");
      itemDetails.classList.add("cart-item-details");
      itemDetails.innerHTML = `
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">$${item.price.toFixed(2)}</span>
      `;

      let quantityControls = document.createElement("div");
      quantityControls.classList.add("quantity-controls");

      let decrementBtn = document.createElement("button");
      decrementBtn.classList.add("qty-btn", "decrement-btn");
      decrementBtn.textContent = "-";
      decrementBtn.dataset.productId = item.productId;

      let quantityDisplay = document.createElement("span");
      quantityDisplay.classList.add("quantity-display");
      quantityDisplay.textContent = item.quantity;

      let incrementBtn = document.createElement("button");
      incrementBtn.classList.add("qty-btn", "increment-btn");
      incrementBtn.textContent = "+";
      incrementBtn.dataset.productId = item.productId;

      quantityControls.append(decrementBtn, quantityDisplay, incrementBtn);

      let itemTotal = document.createElement("div");
      itemTotal.classList.add("cart-item-total");
      itemTotal.textContent = `$${(item.price * item.quantity).toFixed(2)}`;

      li.append(itemDetails, quantityControls, itemTotal);
      ul.append(li);
    });

    let total = document.createElement("h5");
    total.classList.add("cart-total");
    total.textContent = `Total: $${cart.getTotal().toFixed(2)}`;

    let div = document.createElement("div");
    div.classList.add("cart-info");
    div.append(h4, ul, total);

    if (cart.items.length > 0) {
      let clearButton = this.buildBtn("Clear Cart", "clear-cart-btn");
      div.appendChild(clearButton);
    }

    this.resultArr.push(div);
  }
}
