import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { amount, from, to } = await request.json();

        if (!amount || !from || !to) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // Using ExchangeRate-API (free tier: 1,500 requests/month)
        // Can also use:
        // - exchangerate-api.com (free)
        // - fixer.io (free tier available)
        // - currencyapi.com (free tier available)

        const apiUrl = `https://api.exchangerate-api.com/v4/latest/${from}`;

        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error("Failed to fetch exchange rates");

        const data = await response.json();

        // Check if the target currency exists in the rates
        if (!data.rates[to]) {
            return NextResponse.json({ success: false, error: `Currency ${to} not found` }, { status: 404 });
        }

        const exchangeRate = data.rates[to];
        const convertedAmount = amount * exchangeRate;

        return NextResponse.json({
            success: true,
            amount,
            from,
            to,
            exchangeRate,
            convertedAmount,
            timestamp: data.time_last_updated,
        });
    } catch (error) {
        console.error("Currency conversion error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
