import { auth } from "./auth.js";

export function getBaseUrl() {
  // Get the group number from the hostname to determine the base URL for BE
  const regex = /webshop\-2025\-(g[0-9]{1,2})\-fe/g;
  const href = window.location.href;
  const match = regex.exec(href);
  if (match) {
    return `https://webshop-2025-be-g4.vercel.app/api/`;
  }
  return "https://webshop-2025-be-g4.vercel.app/api/";
  // return "http://localhost:5001/";
}

export async function fetchData(endpoint = "products") {
  //! DONT USE THIS IN PRODUCTION
  const url = `${getBaseUrl()}${endpoint}`;
  let token = auth.getToken();
  try {
    const response = await axios.get(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function fetchCategories() {
  const url = `${getBaseUrl()}categories`;
  try {
    let token = auth.getToken();
    const response = await axios.get(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
  return [];
}

export async function fetchProductsByCategory(category) {
  const url = `${getBaseUrl()}products/bycategory?category=${category}`;
  try {
    let token = auth.getToken();
    const response = await axios.get(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(`Error fetching products for category ${category}:`, error);
  }
  return [];
}

export async function addProduct(endpoint = "products", product) {
  const url = `${getBaseUrl()}${endpoint}`;
  try {
    let token = auth.getToken();
    const response = await axios.post(url, product, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.status === 201) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
}

export async function deleteProduct(endpoint = "products", productId) {
  const url = `${getBaseUrl()}${endpoint}/${productId}`;
  try {
    let token = auth.getToken();
    const response = await axios.delete(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.status === 200) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

export async function getProductById(endpoint = "products", productId) {
  const url = `${getBaseUrl()}${endpoint}/${productId}`;
  console.log("Fetching product with URL:", url);

  try {
    let token = auth.getToken();
    const response = await axios.get(url, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      console.log("Product data received:", response.data);
      return response.data;
    } else {
      console.error("Error status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error in getProductById:", error);
    throw error;
  }
}

export async function updateProduct(endpoint = "products", productId, product) {
  const url = `${getBaseUrl()}${endpoint}/${productId}`;
  console.log("Updating product at URL:", url);
  console.log("Product data being sent:", product);

  try {
    let token = auth.getToken();

    const productData = { ...product };

    if (productData._id) {
      delete productData._id;
    }

    console.log("Cleaned product data:", productData);

    const response = await axios.put(url, productData, {
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Update response:", response);

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Unexpected status code:", response.status);
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error("Error in updateProduct:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }

    throw error;
  }
}
