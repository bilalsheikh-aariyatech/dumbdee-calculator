"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CalculationResult {
    sellerCost: number;
    rtoBuffer: "100" | "20%";
    priceWithAddedMargin: number;
    finalPlatformSellingPrice: number;
    platformProfit: number;
    profitMargin: number;
    usdPrice?: number;
    exchangeRate?: number;
}

export default function ProductCalculator() {
    const [sellerCost, setSellerCost] = useState("");
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [loading, setLoading] = useState(false);

    const calculatePrice = async () => {
        if (!sellerCost) {
            toast.error("Please enter seller cost");
            return;
        }

        setLoading(true);

        const sc = Number.parseFloat(sellerCost);

        // Step 2: Use reference price as base selling price
        const minimumMargin = 30;
        const priceWithAddedMargin = sc * (1 + minimumMargin / 100);

        // Step 3: Add RTO buffer
        let rtoBuffer: "100" | "20%";

        if (sc >= 750) {
            rtoBuffer = "100";
        } else {
            rtoBuffer = "20%";
        }

        let finalPlatformSellingPrice: number;

        if (rtoBuffer === "100") {
            finalPlatformSellingPrice = priceWithAddedMargin + 100;
        } else {
            const rtoPrice = sc * 0.2;
            const priceWithRTO = priceWithAddedMargin + rtoPrice;

            finalPlatformSellingPrice = priceWithRTO;
        }

        // Step 4: Calculate platform profit
        const platformProfit = finalPlatformSellingPrice - sc;

        // Step 5: Calculate profit margin
        const profitMargin = (platformProfit / sc) * 100;

        // Step 6: Convert to USD
        try {
            const response = await fetch("/api/convert-currency", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: finalPlatformSellingPrice,
                    from: "INR",
                    to: "USD",
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    rtoBuffer,
                    sellerCost: sc,
                    priceWithAddedMargin,
                    finalPlatformSellingPrice,
                    platformProfit,
                    profitMargin,
                    usdPrice: data.convertedAmount,
                    exchangeRate: data.exchangeRate,
                });
            } else {
                // If currency conversion fails, still show INR results
                toast.error("Currency conversion failed, showing INR only");
                setResult({
                    rtoBuffer,
                    sellerCost: sc,
                    priceWithAddedMargin,
                    finalPlatformSellingPrice,
                    platformProfit,
                    profitMargin,
                });
            }
        } catch (error) {
            // If API call fails, still show INR results
            toast.error("Currency conversion unavailable");
            setResult({
                rtoBuffer,
                sellerCost: sc,
                priceWithAddedMargin,
                finalPlatformSellingPrice,
                platformProfit,
                profitMargin,
            });
        } finally {
            setLoading(false);
        }
    };

    const resetCalculation = () => {
        setSellerCost("");
        setResult(null);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-4">
            {/* Input Form */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                        <Calculator className="h-5 w-5" />
                        Product Information & Market Research
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sellerCost" className="text-card-foreground">
                                Seller Cost (₹) *
                            </Label>
                            <Input
                                id="sellerCost"
                                type="number"
                                placeholder="e.g., 300"
                                value={sellerCost}
                                onChange={(e) => setSellerCost(e.target.value)}
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={calculatePrice}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Calculate
                        </Button>

                        <Button
                            onClick={resetCalculation}
                            variant="outline"
                            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                            disabled={loading}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <>
                    {/* Pricing Breakdown */}
                    {result.platformProfit > 0 && (
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-card-foreground">Pricing Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="bg-secondary p-4 rounded-lg">
                                        <div className="text-sm text-secondary-foreground/70">Base Price</div>
                                        <div className="text-xl font-bold text-secondary-foreground">
                                            ₹{result.sellerCost.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <div className="text-sm text-yellow-600">Base Price (30% margin)</div>
                                        <div className="text-xl font-bold text-yellow-800">
                                            ₹{result.priceWithAddedMargin.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                        <div className="text-sm text-red-600">+ RTO Buffer</div>
                                        <div className="text-xl font-bold text-red-800">
                                            ₹
                                            {result?.rtoBuffer === "20%" ? (result.sellerCost * 0.2).toFixed(2) : "100"}
                                        </div>
                                    </div>

                                    <div className="bg-lime-500/10 p-4 rounded-lg border border-lime-500/20">
                                        <div className="text-sm text-lime-500">Final Price for Dumbdee</div>
                                        <div className="text-2xl font-bold text-lime-500">
                                            ₹{result.finalPlatformSellingPrice.toFixed(2)}
                                        </div>
                                        {result.usdPrice && (
                                            <div className="text-sm text-lime-500/70 mt-1">
                                                ${result.usdPrice.toFixed(2)} USD
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <div className="text-sm text-green-600">Dumbdee Platform Profit</div>
                                        <div className="text-2xl font-bold text-green-800">
                                            ₹{result.platformProfit.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-green-600">
                                            {result.profitMargin.toFixed(1)}% margin
                                        </div>
                                    </div>
                                </div>

                                {/* Exchange Rate Info */}
                                {result.exchangeRate && (
                                    <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                                        Exchange Rate: 1 INR = ${result.exchangeRate.toFixed(4)} USD
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
