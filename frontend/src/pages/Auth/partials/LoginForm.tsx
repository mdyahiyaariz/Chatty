import { useNavigate } from "react-router"
import { z } from "zod"
import { useAuthStore } from "../../../stores/authStore"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { authService } from "../../../services/authService"
import { toast } from "sonner"
import { Loader2, Lock, Mail } from "lucide-react"

interface LoginFormProps {
    onSwitch: () => void
}

const loginSchema = z.object({
    email: z.email({message: "Invalid email address"}),
    password: z.string().min(6, {message: "Password must be at least 6 characters long"})
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginForm: React.FC<LoginFormProps> = ({ onSwitch }) => {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();

    const { register, handleSubmit, formState: { errors }} = useForm({
        resolver: zodResolver(loginSchema)
    })

    const mutation = useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            const { user } =  data;
            setUser(user);
            toast.success("Login successfull!")
            return navigate('/');
        },
        onError: (error) => {
            const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Login failed"
            toast.error(msg);
        }
    })

    const onSubmit = (data: LoginFormData) => mutation.mutate(data);

    return <>
        <h2 className="font-display text-2xl text-ink mb-2">Sign in to your account</h2>
        <p className="text-ink/45 text-sm mb-8">Enter your credentials to continue</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-ink/70 mb-2 text-sm">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 size-4 text-ink/35 top-1/2 -translate-y-1/2"/>
                    <input
                        {...register('email')}
                        type="email"
                        className="text-sm w-full pl-10 pr-3 py-3 bg-white border border-paper-line rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal text-ink"
                        placeholder="you@example.com"
                    />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
                <label htmlFor="password" className="block text-ink/70 mb-2 text-sm">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 size-4 text-ink/35 top-1/2 -translate-y-1/2"/>
                    <input
                        {...register('password')}
                        type="password"
                        className="text-sm w-full pl-10 pr-3 py-3 bg-white border border-paper-line rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal text-ink"
                        placeholder="••••••"
                    />
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="mt-2 w-full bg-teal hover:bg-teal-dark disabled:opacity-60 disabled:cursor-not-allowed text-paper font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center cursor-pointer"
            >
                {mutation.isPending ? <Loader2 className="animate-spin size-5"/> : "Sign in"}
            </button>
        </form>

        <div className="text-center text-sm mt-5">
            <span className="text-ink/55">Don't have an account? </span>
            <span onClick={onSwitch} className="text-teal font-medium cursor-pointer hover:underline">Sign up</span>
        </div>
    </>
}

export default LoginForm;
