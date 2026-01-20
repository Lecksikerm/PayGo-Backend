module.exports = function (controller) {
    return async (req, res) => {
        try {
            
            if (!req.user || req.user.role !== "admin") {
                return res.status(403).json({
                    message: "Access denied. Admins only."
                });
            }

            await controller(req, res);

        } catch (error) {
            return res.status(500).json({
                message: "Server error",
                error: error.message
            });
        }
    };
};


