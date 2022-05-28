const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// UPDATE USER
router.put('/:id', async (req, res) => {
    if (req.body.userId === req.params.id || req.user.isAdmin) {      // Si el userId que pongo es el mismo que se generó con la creacion del usuario o corresponde al admin
        if (req.body.password) {
            try {
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);     // Actualizo la password
            } catch (err) {
                res.status(500).json(err);
            }
        }

        try {
            const updateUser = await User.findByIdAndUpdate(req.params.id, {
                $set: req.body,         // va a setear todos los inputs dentro del body
            });
            res.status(200).json("Account has been updated");
        } catch (err) {
            res.status(500).json(err);
        }

    } else {
        return res.status(403).json("You can update only your account");
    }
});

// DELETE USER
router.delete('/:id', async (req, res) => {
    if (req.body.userId === req.params.id || req.user.isAdmin) {
        try {
            await User.findByIdAndDelete(req.params.id);
            return res.status(200).json("Account has been deleted");
        } catch (err) {
            return res.status(500).json(err);
        }
    } else {
        res.status(403).json("You can delete only your account");
    }
});

// GET
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const { password, updatedAt, ...others } = user._doc;
        return res.status(200).json(others);        // Para que la respuesta no muestre password ni updatedAt
    } catch (err) {
        return res.status(500).json(err);
    }
});

// FOLLOW
router.put('/:id/follow', async (req, res) => {
    if (req.body.userId !== req.params.id) {    // Chequeamos si los usuarios son los mismos
        try {
            const user = await User.findById(req.params.id);    // usuario con el :id
            const currentUser = await User.findById(req.body.userId);   // usuario que hace la req
            if (!user.followers.includes(req.body.userId)) {    // si el usuario no sigue al otro usuario
                await user.updateOne({ $push: { followers: req.body.userId } });
                await currentUser.updateOne({ $push: { followings: req.params.id } });
                return res.status(200).json("User followed");
            } else {
                res.status(403).json("You already follow this user");
            }
        } catch (err) {
            return res.status(500).json(err);
        }
    } else {
        res.status(403).json("You can't follow yourself");
    }
});

// UNFOLLOW
router.put("/:id/unfollow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if (user.followers.includes(req.body.userId)) {
                await user.updateOne({ $pull: { followers: req.body.userId } });
                await currentUser.updateOne({ $pull: { followings: req.params.id } });
                res.status(200).json("User unfollowed");
            } else {
                res.status(403).json("You don't follow this user");
            }
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("You cant unfollow yourself");
    }
});

module.exports = router; 