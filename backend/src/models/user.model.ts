import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface cho User Document
export interface IUser extends mongoose.Document {
    username: string;
    name: string;
    email?: string;
    password?: string;
    role: 'admin' | 'staff';
    createdAt: Date;
    matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
    username: {
        type: String,
        required: [true, 'Vui lòng nhập tên đăng nhập'],
        unique: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: [true, 'Vui lòng nhập họ và tên'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true,
        match: [/^(|\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+)$/, 'Email không hợp lệ']
    },
    password: {
        type: String,
        required: [true, 'Vui lòng nhập mật khẩu'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'staff'],
        default: 'staff'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
});

// Phương thức kiểm tra mật khẩu
userSchema.methods.matchPassword = async function(enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password!);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
