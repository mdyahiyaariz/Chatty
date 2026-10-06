import { useState } from "react";

import { MessageCircle } from "lucide-react"
import RegisterForm from "./partials/RegisterForm";
import LoginForm from "./partials/LoginForm";

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    return <>
        <div className="min-h-screen w-full bg-paper flex flex-col md:flex-row">
            <div className="w-full md:w-5/12 bg-ink p-10 text-paper flex flex-col justify-center">
                <div className="max-w-sm mx-auto md:mx-0">
                    <div className="bg-white/5 size-14 rounded-xl flex items-center justify-center mb-8">
                        <MessageCircle className="size-6 text-teal" />
                    </div>
                    <h1 className="font-display text-4xl leading-tight mb-4">Conversations worth keeping</h1>
                    <p className="text-paper/55 text-sm leading-relaxed">Chatty keeps your messages in one calm, uncluttered place — connect with friends in real time, from any device.</p>
                </div>
            </div>

            <div className="w-full md:w-7/12 flex p-8 justify-center items-center">
                {isLogin ? (
                    <div className="w-full md:w-[380px]">
                        <LoginForm onSwitch={() => setIsLogin(false)} />
                    </div>
                ) : (
                    <div className="w-full md:w-[380px]">
                        <RegisterForm onSwitch={() => setIsLogin(true)} />
                    </div>
                )}
            </div>
        </div>
    </>
}

export default Auth;
