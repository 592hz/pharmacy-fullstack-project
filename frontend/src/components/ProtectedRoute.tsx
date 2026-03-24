import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ 
    children, 
    requiredRole 
}: { 
    children: React.ReactNode, 
    requiredRole?: 'admin' | 'staff' 
}) {
    const { token, user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    if (!token) {
        // Chuyển hướng đến trang login và lưu lại vị trí hiện tại
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user && user.role !== requiredRole) {
        // Nếu không có quyền, chuyển hướng về trang chủ hoặc trang báo lỗi
        return <Navigate to="/products" replace />;
    }

    return <>{children}</>;
}
