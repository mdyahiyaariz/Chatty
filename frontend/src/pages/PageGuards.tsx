import { Navigate, Outlet } from "react-router";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";

export function PrivateRoute() {
    const {data: user, isLoading, isError} = useAuth();
    const setUser = useAuthStore((s) => s.setUser);

    // Keep the locally stored profile in sync with the server (for example after an avatar change on another device).
    useEffect(() => {
        if (user?.user) setUser(user.user);
    }, [user, setUser]);

    if (isLoading) {
        return <div className="min-h-screen flex w-full items-center justify-center">
            <div className="size-10 bg-sky-200 rounded-full animate-bounce"></div>
        </div>
    }

    if (isError || !user) return <Navigate to="/auth" />

    return <Outlet />
}

export function GuestRoute() {
    const {data: user, isLoading} = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex w-full items-center justify-center">
            <div className="size-10 bg-sky-200 rounded-full animate-bounce"></div>
        </div>
    }

    return !user ? <Outlet /> : <Navigate to="/"/> 
}