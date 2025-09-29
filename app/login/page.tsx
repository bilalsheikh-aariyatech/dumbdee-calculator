"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Create base64 encoded auth string
        const authString = btoa(`${username}:${password}`);

        // Store in cookie
        document.cookie = `auth=${authString};path=/`;

        // Try to access the home page
        const response = await fetch("/");

        if (response.ok) {
            router.push("/");
            router.refresh();
        } else {
            setError("Invalid credentials");
            document.cookie = "auth=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-[400px] p-6">
                <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="email"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
