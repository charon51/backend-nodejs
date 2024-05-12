const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Preference = require("../models/Preference");

/**
 * @desc Get a user by id
 * @route GET /users
 * @access Private
**/
const getUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // confirmar datos requeridos
    if (!id) {
        return res.status(400).json({ message: "identificación de usuario requerida" });
    }

    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(400).json({ message: "usuario no encontrado" });
    } else {
        return res.json({ user });
    }
});

/**
 * @desc Create new user
 * @route POST /users
 * @access Private
**/
const createUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    // confirm request body
    if (!username || !password) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // check for duplicate username
    const duplicate = await User.findOne({ username }).collation({ locale: "en", strength: 2 }).lean().exec();
    if (duplicate) {
        return res.status(409).json({ message: "nombre de usuario ya existe" });
    }

    // hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // create a user
    const user = await User.create({ username, password: hashedPassword });

    // send response
    if (user) {
        return res.status(200).json({ message: `Nuevo usuario ${username} creado` });
    } else {
        return res.status(400).json({ message: `Entrada no válida recibida` });
    }
});

/**
 * @desc Update a user
 * @route PATCH /users
 * @access Private
**/
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, password } = req.body;

    // confirmar los datos 
    if (!id || !username) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // confirmar la existencia del usuario
    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(400).json({ message: "El usuario no se encuentra" });
    }

    // comprobar si hay duplicados
    const duplicate = await User.findOne({ username }).collation({ locale: "en", strength: 2 }).lean().exec();
    // Permitir actualizaciones al usuario original
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: "Username already exists" });
    }

    // Actualizar al usuario
    user.username = username;
    if (password) user.password = await bcrypt.hash(password, 10);

    const updatedUser = await user.save();

    // crear token de actualización
    const refreshToken = jwt.sign(
        { username: updatedUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    // crear una cookie segura con un token de actualización
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // accesible sólo por servidor web
        secure: true, // https
        sameSite: "none", // cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    return res.json({ message: `Usuario ${updatedUser.username} esta actualizado` });
});

/**
 * @desc Delete a user
 * @route DELETE /users
 * @access Private
**/
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: "Se requiere identificación de usuario" });
    }

    const preference = await Preference.findOne({ user: id }).lean().exec();
    if (preference) {
        await Preference.deleteOne({ user: id }).exec();
    }

    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(404).json({ message: "El usuario no se encuentra" });
    } else {
        await user.deleteOne();
        return res.json({ message: "El usuario y su preferencia se eliminan." });
    }
});

module.exports = {
    getUser,
    createUser,
    updateUser,
    deleteUser
};