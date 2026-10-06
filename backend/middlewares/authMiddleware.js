import jwt from "jsonwebtoken"
import User from "../models/User.js"

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({message: "Not authorized"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        // A deleted account must not keep working with an old token.
        if (!user) {
            return res.status(401).json({message: "Not authorized"});
        }

        req.user = user;
        next();

    } catch {
        res.status(401).json({message: "Not authorized"});
    }
}

export default authMiddleware;
