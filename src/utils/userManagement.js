import { getBaseUrl } from "./api.js";
import { auth } from "./auth.js";

// Function to fetch all users
export async function fetchUsers() {
  try {
    const token = auth.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.get(`${getBaseUrl()}auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Failed to fetch users");
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// Function to update user admin status
export async function updateUserAdminStatus(userId, isAdmin) {
  try {
    const token = auth.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.put(
      `${getBaseUrl()}auth/users/${userId}/admin`,
      { isAdmin },
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
      throw new Error("Failed to update user admin status");
    }
  } catch (error) {
    console.error("Error updating user admin status:", error);
    throw error;
  }
}

// Function to delete a user
export async function deleteUser(userId) {
  try {
    const token = auth.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.delete(`${getBaseUrl()}auth/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Failed to delete user");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

// Function to build the users display
export function buildUsersList(users, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!users || users.length === 0) {
    container.innerHTML = "<p>No users found</p>";
    return;
  }

  users.forEach((user) => {
    const userItem = document.createElement("div");
    userItem.className = "user-item";
    userItem.dataset.userId = user._id;

    userItem.innerHTML = `
      <div class="user-info">
        <span class="user-name">${user.firstname} ${user.lastname}</span>
        <span class="user-email">${user.email}</span>
        <span class="user-status ${
          user.isAdmin ? "admin-badge" : "customer-badge"
        }">
          ${user.isAdmin ? "Admin" : "Customer"}
        </span>
      </div>
      <div class="user-actions">
        <button class="edit-user-btn" data-user-id="${user._id}">Edit</button>
        <button class="delete-user-btn" data-user-id="${
          user._id
        }">Delete</button>
      </div>
    `;

    container.appendChild(userItem);
  });

  initUserActionButtons();
}

function initUserActionButtons() {
  document.querySelectorAll(".edit-user-btn").forEach((button) => {
    button.addEventListener("click", handleEditUser);
  });

  document.querySelectorAll(".delete-user-btn").forEach((button) => {
    button.addEventListener("click", handleDeleteUser);
  });
}

async function handleEditUser(event) {
  event.stopPropagation();

  const userId = event.target.dataset.userId;
  const userItem = event.target.closest(".user-item");

  if (!userId || !userItem) return;

  const userName = userItem.querySelector(".user-name").textContent;
  const userEmail = userItem.querySelector(".user-email").textContent;
  const isAdmin = userItem
    .querySelector(".user-status")
    .classList.contains("admin-badge");

  const modalContent = document.querySelector("#modalContent");
  const modal = document.querySelector("#modal");

  if (!modalContent || !modal) return;

  modalContent.innerHTML = "";

  const editForm = document.createElement("div");
  editForm.className = "user-edit-form";
  editForm.innerHTML = `
    <h2>Edit User</h2>
    <p><strong>Name:</strong> ${userName}</p>
    <p><strong>Email:</strong> ${userEmail}</p>
    
    <div class="admin-toggle">
      <label for="isAdmin">Admin Status:</label>
      <select id="isAdmin" name="isAdmin">
        <option value="false" ${!isAdmin ? "selected" : ""}>Customer</option>
        <option value="true" ${isAdmin ? "selected" : ""}>Admin</option>
      </select>
    </div>
    
    <div class="form-actions">
      <button id="cancelEditBtn" type="button">Cancel</button>
      <button id="saveUserBtn" type="button">Save Changes</button>
    </div>
  `;

  modalContent.appendChild(editForm);

  // Add event listeners
  document.getElementById("cancelEditBtn").addEventListener("click", () => {
    modal.close();
  });

  document.getElementById("saveUserBtn").addEventListener("click", async () => {
    const newIsAdmin = document.getElementById("isAdmin").value === "true";

    try {
      await updateUserAdminStatus(userId, newIsAdmin);
      modal.close();

      // Refresh the users list
      const users = await fetchUsers();
      buildUsersList(users, "usersAdmin");
    } catch (error) {
      let errorMessage = "Failed to update user";

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage += ": " + error.response.data.error;
      } else if (error.message) {
        errorMessage += ": " + error.message;
      }

      alert(errorMessage);
    }
  });

  modal.showModal();
}

async function handleDeleteUser(event) {
  event.stopPropagation();

  const userId = event.target.dataset.userId;
  const userItem = event.target.closest(".user-item");

  if (!userId || !userItem) return;

  const userName = userItem.querySelector(".user-name").textContent;

  const modalContent = document.querySelector("#modalContent");
  const modal = document.querySelector("#modal");

  if (!modalContent || !modal) return;

  modalContent.innerHTML = "";

  const confirmDialog = document.createElement("div");
  confirmDialog.className = "delete-confirmation";
  confirmDialog.innerHTML = `
    <h2>Delete User</h2>
    <p>Are you sure you want to delete the user "${userName}"?</p>
    <p>This action cannot be undone.</p>
    
    <div class="confirmation-buttons">
      <button id="cancelDeleteBtn">Cancel</button>
      <button id="confirmDeleteBtn">Delete User</button>
    </div>
  `;

  modalContent.appendChild(confirmDialog);

  document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
    modal.close();
  });

  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", async () => {
      try {
        await deleteUser(userId);
        modal.close();

        const users = await fetchUsers();
        buildUsersList(users, "usersAdmin");
      } catch (error) {
        let errorMessage = "Failed to delete user";

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
