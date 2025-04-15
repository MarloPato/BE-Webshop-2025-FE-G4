import { auth } from "../utils/auth.js";
import { User } from "../classes/user.js"; // Importera klasserna

document.addEventListener("DOMContentLoaded", initRegister);

function initRegister() {
  const registerForm = document.querySelector("#registerForm");
  registerForm.addEventListener("submit", handleRegistration);
}

async function handleRegistration(event) {
  event.preventDefault();

  const firstname = document.querySelector("#firstName").value;
  const lastname = document.querySelector("#lastName").value;
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;


  let user = new User(firstname, lastname, email, password);
  

  let response = await auth.register(user);
  console.log(response);
  if (response.status === 201) {
    window.location.href = "login.html";
  } else {
    alert(response.data.error);
  }
}
