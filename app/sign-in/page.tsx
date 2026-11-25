"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "abo-roqia-pin";

const read = () => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

const write = (pin: string | null) => {
    try {
        if (pin) localStorage.setItem(STORAGE_KEY, pin);
        else localStorage.removeItem(STORAGE_KEY);
    } catch {
        // private mode: the cookie still keeps the session
    }
};

/** Only same-site paths, never an external address */
const nextPath = () => {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
};

export default function SignInPage() {
    const [pin, setPin] = useState("");
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState("");
    const started = useRef(false);

    async function signIn(value: string) {
        setBusy(true);
        setError("");
        try {
            const response = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: value }),
            });
            if (!response.ok) throw new Error("الرمز غير صحيح");

            write(value);
            window.location.replace(nextPath()); // full load, so the new cookie is used right away
        } catch (e) {
            write(null);
            setError(e instanceof Error ? e.message : "حدث خطأ");
            setBusy(false);
        }
    }

    // The PIN is remembered on this device: sign in again silently if the session cookie is gone
    useEffect(() => {
        if (started.current) return;
        started.current = true;

        const saved = read();
        if (saved) {
            setPin(saved);
            void signIn(saved);
        } else setBusy(false);
    }, []);

    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
            <div className="bg-primary/15 text-primary flex size-16 items-center justify-center rounded-full">
                <LockKeyhole className="size-8" />
            </div>

            <div className="text-center">
                <h1 className="text-xl font-semibold">ابورقية للتجارة والتوزيع</h1>
                <p className="text-muted-foreground mt-1 text-sm">أدخل الرمز للدخول</p>
            </div>

            <form
                className="flex w-full max-w-xs flex-col gap-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (pin) void signIn(pin);
                }}
            >
                <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="الرمز"
                    dir="ltr"
                    className="h-11 text-center"
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    disabled={busy}
                    autoFocus
                />
                {error && <p className="text-destructive text-center text-sm">{error}</p>}
                <Button type="submit" className="h-11" disabled={busy || !pin}>
                    {busy ? <Loader2 className="animate-spin" /> : "دخول"}
                </Button>
            </form>
        </main>
    );
}
