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
  const response = await axios.get(url, {headers: {authorization: `Bearer ${token}`}})
  if (response.status === 200) {
    return response.data;
  }
  return [];
}

export async function addProduct(endpoint = "products", product) {
  const url = `${getBaseUrl()}${endpoint}`;
  let token = auth.getToken();
  const response = await axios.post(url, product, {headers: {authorization: `Bearer ${token}`}});
  if (response.status === 201) {
    return response.data;
  }
  return [];
}

export async function deleteProduct(endpoint = "products", productId) {
  const url = `${getBaseUrl()}${endpoint}/${productId}`;
  let token = auth.getToken();
  const response = await axios.delete(url, {headers: {authorization: `Bearer ${token}`}});
  if (response.status === 200) {
    return response.data;
  }
  return [];
}

export async function getProductById(endpoint = "products", productId) {
  const url = `${getBaseUrl()}${endpoint}/${productId}`;
  console.log(productId);
  let token = auth.getToken();
  const response = await axios.get(url, {headers: {authorization: `Bearer ${token}`}});
  if (response.status === 200) {
    return response.data;
  }
  return null;
}

export async function updateProduct(endpoint = "products", productId, product) {
  const url = `${getBaseUrl()}${endpoint}/${productId}`;
  let token = auth.getToken();
  const response = await axios.put(url, product, {headers: {authorization: `Bearer ${token}`}});
  if (response.status === 200) {
    return response.data;
  }
  return null;
}
