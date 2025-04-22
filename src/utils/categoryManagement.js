import { getBaseUrl } from "./api.js";
import { auth } from "./auth.js";

export async function fetchCategories() {
  try {
    const response = await axios.get(`${getBaseUrl()}categories`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Failed to fetch categories");
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function updateCategory(categoryId, categoryData) {
  try {
    const token = auth.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.put(
      `${getBaseUrl()}categories/${categoryId}`,
      categoryData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Failed to update category");
    }
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
}

export async function deleteCategory(categoryId) {
  try {
    const token = auth.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.delete(
      `${getBaseUrl()}categories/${categoryId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Failed to delete category");
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

export async function createCategory(categoryData) {
  try {
    const token = auth.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.post(
      `${getBaseUrl()}categories`,
      categoryData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 201) {
      return response.data;
    } else {
      throw new Error("Failed to create category");
    }
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
}

export function buildCategoriesList(categories, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!categories || categories.length === 0) {
    container.innerHTML = "<p>No categories found</p>";
    return;
  }

  categories.forEach((category) => {
    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";
    categoryItem.dataset.categoryId = category._id;

    categoryItem.innerHTML = `
      <div class="category-info">
        <span class="category-name">${category.name}</span>
      </div>
      <div class="category-actions">
        <button class="edit-category-btn" data-category-id="${category._id}">Edit</button>
        <button class="delete-category-btn" data-category-id="${category._id}">Delete</button>
      </div>
    `;

    container.appendChild(categoryItem);
  });

  initCategoryActionButtons();
}

function initCategoryActionButtons() {
  document.querySelectorAll(".edit-category-btn").forEach((button) => {
    button.addEventListener("click", handleEditCategory);
  });

  document.querySelectorAll(".delete-category-btn").forEach((button) => {
    button.addEventListener("click", handleDeleteCategory);
  });
}

async function handleEditCategory(event) {
  event.stopPropagation();

  const categoryId = event.target.dataset.categoryId;
  const categoryItem = event.target.closest(".category-item");

  if (!categoryId || !categoryItem) return;

  const categoryName = categoryItem.querySelector(".category-name").textContent;

  const modalContent = document.querySelector("#modalContent");
  const modal = document.querySelector("#modal");

  if (!modalContent || !modal) return;

  modalContent.innerHTML = "";

  const editForm = document.createElement("div");
  editForm.className = "category-edit-form";
  editForm.innerHTML = `
    <h2>Edit Category</h2>
    
    <div class="form-group">
      <label for="categoryName">Category Name:</label>
      <input type="text" id="categoryName" name="categoryName" value="${categoryName}" required>
    </div>
    
    <div class="form-actions">
      <button id="saveCategoryBtn" type="button">Update Category</button>
    </div>
  `;

  modalContent.appendChild(editForm);

  document
    .getElementById("saveCategoryBtn")
    .addEventListener("click", async () => {
      const newName = document.getElementById("categoryName").value.trim();

      if (!newName) {
        alert("Category name cannot be empty");
        return;
      }

      try {
        await updateCategory(categoryId, { name: newName });
        modal.close();

        const categories = await fetchCategories();
        buildCategoriesList(categories, "categoriesAdmin");
      } catch (error) {
        let errorMessage = "Failed to update category";

        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          errorMessage += ": " + error.response.data.error;
        } else if (error.message) {
          errorMessage += ": " + error.message;
        }

        alert(errorMessage);
      }
    });

  modal.showModal();
}

async function handleDeleteCategory(event) {
  event.stopPropagation();

  const categoryId = event.target.dataset.categoryId;
  const categoryItem = event.target.closest(".category-item");

  if (!categoryId || !categoryItem) return;

  const categoryName = categoryItem.querySelector(".category-name").textContent;

  const modalContent = document.querySelector("#modalContent");
  const modal = document.querySelector("#modal");

  if (!modalContent || !modal) return;

  modalContent.innerHTML = "";

  const confirmDialog = document.createElement("div");
  confirmDialog.className = "delete-confirmation";
  confirmDialog.innerHTML = `
    <h2>Delete Category</h2>
    <p>Are you sure you want to delete the category "${categoryName}"?</p>
    <p>This action cannot be undone. Products in this category may be affected.</p>
    
    <div class="confirmation-buttons">
      <button id="confirmDeleteBtn">Delete</button>
    </div>
  `;

  modalContent.appendChild(confirmDialog);

  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", async () => {
      try {
        await deleteCategory(categoryId);
        modal.close();

        const categories = await fetchCategories();
        buildCategoriesList(categories, "categoriesAdmin");
      } catch (error) {
        let errorMessage = "Failed to delete category";

        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          errorMessage += ": " + error.response.data.error;
        } else if (error.message) {
          errorMessage += ": " + error.message;
        }

        alert(errorMessage);
      }
    });

  modal.showModal();
}
