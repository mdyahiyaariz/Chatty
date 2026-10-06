import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { authService } from "../../../services/authService"
import { toast } from "sonner"
import { Loader2, Lock, Mail, User } from "lucide-react"

interface RegisterFormProps {
    onSwitch: () => void
}

const registerSchema = z.object({
    fullName: z.string().trim().min(2, {message: "Full name is too short"}),
    username: z.string()
               .regex(/^[a-z0-9_]+$/, {message: "Username can only contain lowercase letters, numbers, and underscores"})
               .min(2, {message: "Username is too short"})
               .max(12, {message: "Username is too long"})
               .transform(val => val.toLocaleLowerCase()),
    email: z.email({message: "Invalid email address"}),
    password: z.string().min(6, {message: "Password must be at least 6 characters long"}),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitch }) => {
    const {
        register, handleSubmit, formState: { errors }
    } = useForm({
        resolver: zodResolver(registerSchema)
    })

    const mutation = useMutation({
        mutationFn: authService.register,
        onSuccess: () => {
            onSwitch();
            toast.success("Account created! You can now sign in!")
        },
        onError: (error: unknown) => {
            const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Registration failed"
            toast.error(msg)
        },
    })

    const onSubmit = (data: RegisterFormData) => mutation.mutate(data);

    return <>
        <h2 className="font-display text-2xl text-ink mb-2">Create your account</h2>
        <p className="text-ink/45 text-sm mb-8">Join the conversation</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label htmlFor="fullName" className="block text-ink/70 mb-2 text-sm">Full name</label>
                <div className="relative">
                    <User className="absolute left-3 size-4 text-ink/35 top-1/2 -translate-y-1/2"/>
                    <input
                        {...register('fullName')}
                        className="text-sm w-full pl-10 pr-3 py-3 bg-white border border-paper-line rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal text-ink"
                        placeholder="Enter your name"
                    />
                </div>
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
                <label htmlFor="username" className="block text-ink/70 mb-2 text-sm">Username</label>
                <div className="relative">
                    <User className="absolute left-3 size-4 text-ink/35 top-1/2 -translate-y-1/2"/>
                    <input
                        {...register('username')}
                        className="text-sm w-full pl-10 pr-3 py-3 bg-white border border-paper-line rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal text-ink"
                        placeholder="Enter your username"
                    />
                </div>
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
            </div>

            <div>
                <label htmlFor="email" className="block text-ink/70 mb-2 text-sm">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 size-4 text-ink/35 top-1/2 -translate-y-1/2"/>
                    <input
                        {...register('email')}
                        type="email"
                        className="text-sm w-full pl-10 pr-3 py-3 bg-white border border-paper-line rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal text-ink"
                        placeholder="username@example.com"
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

            <div>
                <label htmlFor="confirmPassword" className="block text-ink/70 mb-2 text-sm">Confirm password</label>
                <div className="relative">
                    <Lock className="absolute left-3 size-4 text-ink/35 top-1/2 -translate-y-1/2"/>
                    <input
                        {...register('confirmPassword')}
                        type="password"
                        className="text-sm w-full pl-10 pr-3 py-3 bg-white border border-paper-line rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal text-ink"
                        placeholder="••••••"
                    />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="mt-2 w-full bg-teal hover:bg-teal-dark disabled:opacity-60 disabled:cursor-not-allowed text-paper font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center cursor-pointer"
            >
                {mutation.isPending ? <Loader2 className="animate-spin size-5"/> : "Create account"}
            </button>
        </form>

        <div className="text-center text-sm mt-5">
            <span className="text-ink/55">Already have an account? </span>
            <span onClick={onSwitch} className="text-teal font-medium cursor-pointer hover:underline">Sign in</span>
        </div>
    </>
}

export default RegisterForm;
