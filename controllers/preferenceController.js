const asyncHandler = require("express-async-handler");
const Preference = require("../models/Preference");

/**
 * @desc Get preference by id
 * @route GET /preference
 * @access Private
**/
const getPreference = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ message: "Se requiere identificación de usuario" });
    }

    const preference = await Preference.findOne({ user: userId }).exec();
    if (!preference || preference.length === 0) {
        return res.status(404).json({ message: "Preferencia no encontrada" });
    } else {
        return res.json({ preference });
    }
});

/**
 * @desc Create preference
 * @route POST /preference
 * @access Private
**/
const createPreference = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: "Se requiere identificación de usuario" });
    }

    const duplicate = await Preference.findOne({ user: userId }).lean().exec();
    if (duplicate) {
        return res.status(409).json({ message: `Preferencia de usuario ${userId} ya existe` });
    }

    const preference = await Preference.create({ user: userId });
    if (preference) {
        return res.status(201).json({ message: `Preferencia de usuario ${userId} es creado` });
    } else {
        return res.status(400).json({ messge: "Se recibieron datos de usuario no válidos" });
    }
});

/**
 * @desc Update preference
 * @route PATCH /preference
 * @access Private
**/
const updatePreference = asyncHandler(async (req, res) => {
    const { id, diets, allergies, favorites, ingredients } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Se requiere identificación de preferencia" });
    }

    if(diets && diets.length < 1) {
        return res.status(400).json({ message: "Debe existir al menos una preferencia de Dieta"});
    }

    if (favorites && favorites.length < 2) {
        return res.status(400).json({ message: "Los favoritos deben ser al menos 2" });
    }

    if (ingredients && ingredients.length < 4) {
        return res.status(400).json({ message: "Los ingredientes deben ser al menos 4" });
    }

    const preference = await Preference.findById(id).exec();
    if (!preference) {
        return res.status(400).json({ message: "No se encuentra preferencia" });
    }

    preference.diets = diets;
    preference.allergies = allergies;
    preference.favorites = favorites;
    preference.ingredients = ingredients;
    await preference.save();

    return res.json({ message: `Se actualiza la preferencia de ${id}` });
});

module.exports = {
    getPreference,
    createPreference,
    updatePreference
};