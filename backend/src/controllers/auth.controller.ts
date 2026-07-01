import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// @desc    Đăng ký người dùng mới
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
    try {
        const { username, name, email, password } = req.body;

        // Kiểm tra người dùng đã tồn tại chưa
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        // Tạo người dùng mới
        const user = await User.create({
            username,
            name,
            email: email || undefined,
            password
        });

        if (user) {
            res.status(201).json({
                token: generateToken(user._id.toString()),
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Đăng nhập người dùng & lấy token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Tìm người dùng theo tên đăng nhập
        const user = await User.findOne({ username }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                token: generateToken(user._id.toString()),
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    name: user.name,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Lấy thông tin người dùng hiện tại
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                id: user._id.toString(),
                username: user.username,
                name: user.name,
                role: user.role
            });
        } else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Tạo JWT Token
const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d'
    });
};
