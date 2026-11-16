
async function registrar() {
  const nombre = document.getElementById("registroNombre").value;
  const correo = document.getElementById("registroCorreo").value;
  const password = document.getElementById("registroPassword").value;

  try {
    const respuesta = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, password })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) throw new Error(datos.error);

    alert("Cuenta creada correctamente. Ahora inicia sesión.");

  } catch (error) {
    alert(error.message);
  }
}

async function iniciarSesion() {
  const correo = document.getElementById("loginCorreo").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const respuesta = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) throw new Error(datos.error);

    location.href = "/pages/perfil.html";

  } catch (error) {
    alert(error.message);
  }
}
