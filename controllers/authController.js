const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

/**
 * @desc Login
 * @route POST /auth/login
 * @access Public
**/
const login = asyncHandler(async (req, res) => {
    // confirm request data
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // el nombre de usuario no existe en la base de datos
    const foundUser = await User.findOne({ username }).exec();
    if (!foundUser) {
        return res.status(401).json({ message: "No autorizado" });
    }

    // la contraseña no coincide
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) {
        return res.status(401).json({ message: "No autorizado" });
    }

    // crear token de acceso
    const accessToken = jwt.sign(
        { username: foundUser.username, id: foundUser._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );

    // crear token de actualización
    const refreshToken = jwt.sign(
        { username: foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    // crear una cookie segura con un token de actualización
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // accesible sólo por servidor web
        secure: true, // https
        sameSite: "none", // cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // enviar token de acceso que contiene nombre de usuario y roles
    return res.json({ accessToken });
});

/**
 * @desc Refresh
 * @route GET /auth/refresh
 * @access Public
**/
const refresh = (req, res) => {
    // el token de actualización no existe en las cookies
    const cookies = req.cookies;

    if (!cookies?.refreshToken) {
        return res.status(401).json({ message: "No autorizado" });
    }

    const refreshToken = cookies.refreshToken;

    // verificar token de actualización
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, asyncHandler(async (err, decoded) => {
        // verificación fallida
        if (err) {
            return res.status(403).json({ message: "Forbidden" });
        }
        
        // nombre de usuario no encontrado en la base de datos
        const foundUser = await User.findOne({ username: decoded.username });
        if (!foundUser) {
            return res.status(401).json({ message: "No autorizado" });
        }

        // crear un nuevo token de acceso
        const accessToken = jwt.sign(
            { username: foundUser.username, id: foundUser._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        return res.json({ accessToken });
    }));
};

/**
 * @desc Logout
 * @route POST /auth/logout
 * @access Public
**/
const logout = (req, res) => {
    // el token de actualización no existe en las cookies
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
        return res.sendStatus(204) // sin contenido
    }

    // eliminar cookies
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "none",
        secure: true
    });
    
    return res.json({ message: "cookie borrada" });
};

module.exports = {
    login,
    refresh,
    logout
};