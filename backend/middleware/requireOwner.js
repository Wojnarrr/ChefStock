const requireOwner = (req, res, next) => {
    if (req.role !== "owner") {
        return res.status(403).json({ message: "Only the restaurant owner can do this" });
    }

    next();
};

module.exports = requireOwner;