import logger from "@/utils/logger";
import { NextRequest, NextResponse } from "next/server";
import { getJson } from "serpapi";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.SERPAPI_MARKET_API_KEY;

        const body = await req.json();
        const { seoTitle } = body;
        if (!seoTitle) {
            return NextResponse.json(
                { success: false, error: "seoTitle not found" },
                { status: 400, statusText: "seoTitle not found" }
            );
        }

        logger.log("seoTitle", seoTitle);

        const response = await getJson({
            engine: "amazon",
            api_key: apiKey,
            k: seoTitle,
            amazon_domain: "amazon.in",
        });

        const data = response;

        return NextResponse.json({ data }, { status: 200, statusText: "Data fetched successfully" });
    } catch (err: any) {
        logger.error("Error in search", err);

        return NextResponse.json(
            { success: false, error: err?.message || "Invalid request" },
            { status: 400, statusText: err?.message?.error?.message || "Invalid request" }
        );
    }
}
