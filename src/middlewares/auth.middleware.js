const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

module.exports = async (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token)
        return res.status(401).json({ message: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // attach full user object to request
        req.user = await User.findById(decoded.id).select("-password");

        if (!req.user)
            return res.status(401).json({ message: "User not found" });

        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Invalid token" });
    }
};

