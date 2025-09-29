import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import logger from "./utils/logger";

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname === "/login") return NextResponse.next();

    const authCookie = request.cookies.get("auth");
    if (!authCookie) return NextResponse.redirect(new URL("/login", request.url));

    try {
        const [username, password] = atob(authCookie.value).split(":");

        if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            return NextResponse.next();
        }
    } catch (error) {
        // Invalid auth cookie format
        logger.error("Error decoding auth cookie:", error);
    }

    // Invalid credentials, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
