import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getUserByUsername, createUser } from "../models/userModel.js";

const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";

const registerUser = async (req, res) => {
    try {
        const db = req.app.get("db");
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Имя пользователя и пароль обязательны!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(db, username, hashedPassword);

        res.status(201).json({ message: "Пользователь успешно зарегистрирован!" });
    } catch (error) {
        console.error("Ошибка регистрации:", error);
        res.status(500).json({ error: "Ошибка сервера." });
    }
};

const loginUser = async (req, res) => {
    try {
        const db = req.app.get("db");
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Имя пользователя и пароль обязательны!" });
        }

        const user = await getUserByUsername(db, username);
        if (!user) {
            return res.status(401).json({ message: "Пользователь не найден." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Неверный пароль." });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ message: "Авторизация успешна!", token });
    } catch (error) {
        console.error("Ошибка авторизации:", error);
        res.status(500).json({ error: "Ошибка сервера." });
    }
};

export { registerUser, loginUser };
