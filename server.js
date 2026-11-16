
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ======================================
// CONFIGURACIÓN GENERAL
// ======================================

const PUBLIC = path.join(__dirname, "public");
const DATA = path.join(__dirname, "data");

app.use(express.json({ limit: "20kb" }));

app.use(express.static(PUBLIC));

app.use(session({
    name: "gamestore.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ======================================
// CREAR ARCHIVOS JSON SI NO EXISTEN
// ======================================

if (!fs.existsSync(DATA)) {
    fs.mkdirSync(DATA, { recursive: true });
}

function inicializarArchivo(nombre) {
    const archivo = path.join(DATA, nombre);

    if (!fs.existsSync(archivo)) {
        fs.writeFileSync(archivo, "[]");
    }
}

inicializarArchivo("products.json");
inicializarArchivo("users.json");
inicializarArchivo("purchases.json");

// ======================================
// LEER Y GUARDAR JSON
// ======================================

function leerJSON(nombre) {
    const archivo = path.join(DATA, nombre);
    return JSON.parse(fs.readFileSync(archivo, "utf8"));
}

function guardarJSON(nombre, datos) {
    const archivo = path.join(DATA, nombre);
    const temporal = archivo + ".tmp";

    fs.writeFileSync(
        temporal,
        JSON.stringify(datos, null, 2)
    );

    fs.renameSync(temporal, archivo);
}

// ======================================
// PROTEGER RUTAS
// ======================================

function verificarSesion(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({
            error: "Debes iniciar sesión."
        });
    }

    next();
}

// ======================================
// PÁGINA PRINCIPAL
// ======================================

app.get("/", (req, res) => {
    res.redirect("/pages/index.html");
});

// ======================================
// CATÁLOGO
// ======================================

app.get("/api/productos", (req, res) => {
    try {
        const productos = leerJSON("products.json");
        res.json(productos);
    } catch (error) {
        res.status(500).json({
            error: "Error al cargar productos."
        });
    }
});

// ======================================
// REGISTRO DE USUARIOS
// ======================================

app.post("/api/registro", async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        if (
            typeof nombre !== "string" ||
            typeof correo !== "string" ||
            typeof password !== "string" ||
            !nombre.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
            password.length < 8 ||
            password.length > 128
        ) {
            return res.status(400).json({
                error: "Datos incorrectos. Revisa los campos."
            });
        }

        const usuarios = leerJSON("users.json");
        const email = correo.trim().toLowerCase();

        if (usuarios.some(u => u.correo === email)) {
            return res.status(409).json({
                error: "El correo ya está registrado."
            });
        }

        const hash = await bcrypt.hash(password, 12);

        const nuevoUsuario = {
            id: crypto.randomUUID(),
            nombre: nombre.trim(),
            correo: email,
            password: hash,
            fechaRegistro: new Date().toISOString()
        };

        usuarios.push(nuevoUsuario);

        guardarJSON("users.json", usuarios);

        res.status(201).json({
            mensaje: "Registro exitoso."
        });

    } catch (error) {
        res.status(500).json({
            error: "Error al registrar usuario."
        });
    }
});

// ======================================
// INICIAR SESIÓN
// ======================================

app.post("/api/login", async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (
            typeof correo !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                error: "Completa tus datos."
            });
        }

        const usuarios = leerJSON("users.json");

        const usuario = usuarios.find(
            u => u.correo === correo.trim().toLowerCase()
        );

        if (
            !usuario ||
            !(await bcrypt.compare(password, usuario.password))
        ) {
            return res.status(401).json({
                error: "Correo o contraseña incorrectos."
            });
        }

        req.session.regenerate(error => {
            if (error) {
                return res.status(500).json({
                    error: "No se pudo iniciar sesión."
                });
            }

            req.session.usuario = {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo
            };

            res.json({
                mensaje: "Bienvenido a GameStore.",
                usuario: req.session.usuario
            });
        });

    } catch (error) {
        res.status(500).json({
            error: "Error al iniciar sesión."
        });
    }
});

// ======================================
// CONSULTAR USUARIO ACTUAL
// ======================================

app.get("/api/usuario", (req, res) => {
    res.json({
        usuario: req.session.usuario || null
    });
});

// ======================================
// CERRAR SESIÓN
// ======================================

app.post("/api/logout", (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({
                error: "No se pudo cerrar sesión."
            });
        }

        res.clearCookie("gamestore.sid");

        res.json({
            mensaje: "Sesión cerrada correctamente."
        });
    });
});

// ======================================
// REALIZAR COMPRA
// ======================================

app.post("/api/comprar", verificarSesion, (req, res) => {
    try {
        const { productos } = req.body;

        if (
            !Array.isArray(productos) ||
            productos.length === 0 ||
            productos.length > 50
        ) {
            return res.status(400).json({
                error: "Carrito vacío o inválido."
            });
        }

        const catalogo = leerJSON("products.json");
        const compraProductos = [];

        for (const item of productos) {
            const juego = catalogo.find(
                p => p.id === item.id
            );

            if (
                !juego ||
                !Number.isInteger(item.cantidad) ||
                item.cantidad < 1 ||
                item.cantidad > 20
            ) {
                return res.status(400).json({
                    error: "Producto o cantidad inválidos."
                });
            }

            compraProductos.push({
                id: juego.id,
                nombre: juego.nombre,
                precio: juego.precio,
                cantidad: item.cantidad
            });
        }

        const total = compraProductos.reduce(
            (suma, p) => suma + p.precio * p.cantidad,
            0
        );

        const compras = leerJSON("purchases.json");

        const nuevaCompra = {
            id: crypto.randomUUID(),
            codigo: "GAME-" + crypto.randomUUID()
                .split("-")[0].toUpperCase(),
            usuarioId: req.session.usuario.id,
            correo: req.session.usuario.correo,
            productos: compraProductos,
            total,
            fecha: new Date().toISOString(),
            estado: "Confirmada"
        };

        compras.push(nuevaCompra);

        guardarJSON("purchases.json", compras);

        res.status(201).json({
            mensaje: "Compra realizada correctamente.",
            compra: nuevaCompra
        });

    } catch (error) {
        res.status(500).json({
            error: "No se pudo realizar la compra."
        });
    }
});

// ======================================
// HISTORIAL DE COMPRAS
// ======================================

app.get("/api/compras", verificarSesion, (req, res) => {
    try {
        const compras = leerJSON("purchases.json");

        const misCompras = compras.filter(
            compra => compra.usuarioId === req.session.usuario.id
        );

        res.json(misCompras);

    } catch (error) {
        res.status(500).json({
            error: "Error al consultar las compras."
        });
    }
});

// ======================================
// MANEJO DE ERRORES
// ======================================

app.use((req, res) => {
    res.status(404).json({
        error: "Ruta no encontrada."
    });
});

// ======================================
// INICIAR SERVIDOR
// ======================================

app.listen(PORT, () => {
    console.log("================================");
    console.log("🎮 GAMESTORE");
    console.log("================================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("Estado: Funcionando");
    console.log("================================");
});
