import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import generateUniqueConnectCode from "../utils/generateUniqueConnectCode.js";
import { isAvatarUrl, removeAvatarFile } from "../utils/files.js";
import { broadcastProfileUpdate } from "../utils/broadcast.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cookieOptions = () => ({
    httpOnly: true,
    sameSite: process.env.COOKIE_SAMESITE || "strict",
    secure: process.env.NODE_ENV !== "development"
});

const publicProfile = (user) => ({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    connectCode: user.connectCode,
    avatarUrl: user.avatarUrl || null,
});

class AuthController {
    static async register(req, res) {
        try {
            const { fullName, username, email, password } = req.body;

            if (![fullName, username, email, password].every(v => typeof v === "string" && v.trim())) {
                return res.status(400).json({message: "All fields are required"});
            }

            if (!EMAIL.test(email.trim())) {
                return res.status(400).json({message: "Enter a valid email address"});
            }

            if (fullName.trim().length < 3 || fullName.trim().length > 30 || username.trim().length < 3 || username.trim().length > 30) {
                return res.status(400).json({message: "Name and username must be 3 to 30 characters"});
            }

            if (password.length < 6) {
                return res.status(400).json({message: "Password must be at least 6 characters long"});
            }

            const cleanEmail = email.trim().toLowerCase();
            const cleanUsername = username.trim();

            const existingUser = await User.findOne({
                $or: [{username: cleanUsername}, {email: cleanEmail}]
            });

            if (existingUser) {
                return res.status(400).json({message: "User already exists with username or email"});
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = new User({
                username: cleanUsername,
                fullName: fullName.trim(),
                email: cleanEmail,
                password: hashedPassword,
                connectCode: await generateUniqueConnectCode(),
            });

            await user.save();

            res.status(201).json({success: true});

        } catch (error) {
            console.error("Registration error", error);
            res.status(500).json({message: "Internal server error"});
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
                return res.status(400).json({message: "Invalid credentials"});
            }

            const user = await User.findOne({ email: email.trim().toLowerCase() });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(400).json({message: "Invalid credentials"});
            }

            const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET, {
                expiresIn: '7d'
            })

            res.cookie("jwt", token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 })

            res.status(200).json({ user: publicProfile(user) })

        } catch (error) {
            console.error("Login error", error);
            res.status(500).json({message: "Internal server error"});
        }
    }

    static async me(req, res) {
        res.status(200).json({ user: publicProfile(req.user) })
    }

    /** PATCH /auth/profile: change display name and/or profile picture. avatarUrl null removes the picture. */
    static async updateProfile(req, res) {
        try {
            const { fullName, avatarUrl } = req.body;
            const user = await User.findById(req.user._id);

            if (fullName !== undefined) {
                const name = typeof fullName === "string" ? fullName.trim() : "";
                if (name.length < 3 || name.length > 30) {
                    return res.status(400).json({message: "Name must be 3 to 30 characters"});
                }
                user.fullName = name;
            }

            if (avatarUrl !== undefined) {
                if (avatarUrl !== null && !isAvatarUrl(avatarUrl)) {
                    return res.status(400).json({message: "Invalid profile picture"});
                }
                if (user.avatarUrl && user.avatarUrl !== avatarUrl) {
                    await removeAvatarFile(user.avatarUrl);
                }
                user.avatarUrl = avatarUrl;
            }

            await user.save();
            await broadcastProfileUpdate(req.app.get("io"), user);

            res.json({ user: publicProfile(user) });

        } catch (error) {
            console.error("Update profile error", error);
            res.status(500).json({message: "Internal server error"});
        }
    }

    static async logout(req, res) {
        res.clearCookie("jwt", cookieOptions());
        res.json({message: "Logged out successfully!"});
    }
}

export default AuthController;
