"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CalculationResult {
    sellerCost: number;
    rtoBuffer: "100" | "20%";
    priceWithAddedMargin: number;
    finalPlatformSellingPrice: number;
    platformProfit: number;
    profitMargin: number;
}

export default function ProductCalculator() {
    const [sellerCost, setSellerCost] = useState("");
    const [result, setResult] = useState<CalculationResult | null>(null);

    const calculatePrice = () => {
        if (!sellerCost) {
            toast.error("Please enter seller cost");
            return;
        }

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

        setResult({
            rtoBuffer,
            sellerCost: sc,
            priceWithAddedMargin,
            finalPlatformSellingPrice,
            platformProfit,
            profitMargin,
        });
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
                        <Button onClick={calculatePrice} className="bg-blue-600 text-white hover:bg-blue-700">
                            Calculate
                        </Button>

                        <Button
                            onClick={resetCalculation}
                            variant="outline"
                            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
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

                                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                                        <div className="text-sm text-primary">Final Price for Dumbdee</div>
                                        <div className="text-2xl font-bold text-primary">
                                            ₹{result.finalPlatformSellingPrice.toFixed(2)}
                                        </div>
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
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
