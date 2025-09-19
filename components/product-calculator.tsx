"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalculationResult } from "@/types/product-calculator";
import { Calculator, Download, RotateCcw, Save } from "lucide-react";
import { useState } from "react";

export function ProductCalculator() {
    const [category, setCategory] = useState("");
    const [marketPrice, setMarketPrice] = useState("");
    const [sellerPrice, setSellerPrice] = useState("");
    const [result, setResult] = useState<CalculationResult | null>(null);

    const categories = ["Saree", "Dress", "Shirt", "Kurta", "Jeans", "T-Shirt"];

    const calculateProfit = () => {
        const mp = Number.parseFloat(marketPrice);
        const sp = Number.parseFloat(sellerPrice);

        if (!mp || !sp || mp <= 0 || sp <= 0) {
            alert("Please enter valid prices");
            return;
        }

        const difference = sp - mp;
        const dumbdeePercentage = sp > mp ? 20 : 30;
        const gst = 5;

        // Calculate Dumbdee Price: (SP × DP%) × (1 + GST%)
        const dumbdeePrice = sp * (dumbdeePercentage / 100);
        const finalProfit = dumbdeePrice * (1 + gst / 100);

        setResult({
            marketPrice: mp,
            sellerPrice: sp,
            difference,
            dumbdeePercentage,
            dumbdeePrice,
            gst,
            finalProfit,
        });
    };

    const resetCalculation = () => {
        setCategory("");
        setMarketPrice("");
        setSellerPrice("");
        setResult(null);
    };

    const exportData = () => {
        if (!result) return;

        const exportData = `
					Dumbdee Product Calculator Results
					================================
					Product Category: ${category}
					Market Price: ₹${result.marketPrice.toFixed(2)}
					Seller Price: ₹${result.sellerPrice.toFixed(2)}
					Price Difference: ₹${result.difference.toFixed(2)}
					Dumbdee Percentage: ${result.dumbdeePercentage}%
					GST: ${result.gst}%
					Final Platform Profit: ₹${result.finalProfit.toFixed(2)}
    		`;

        const blob = new Blob([exportData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dumbdee-calculation-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const saveCalculation = () => {
        if (!result) return;

        const calculations = JSON.parse(localStorage.getItem("dumbdee-calculations") || "[]");
        calculations.push({
            ...result,
            category,
            timestamp: new Date().toISOString(),
        });
        localStorage.setItem("dumbdee-calculations", JSON.stringify(calculations));
        alert("Calculation saved successfully!");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Input Form */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                        <Calculator className="h-5 w-5" />
                        Product Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-card-foreground">
                                Product Category
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-input border-border text-foreground">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat} className="text-popover-foreground">
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="marketPrice" className="text-card-foreground">
                                Market Price (₹)
                            </Label>
                            <Input
                                id="marketPrice"
                                type="number"
                                placeholder="e.g., 1800"
                                value={marketPrice}
                                onChange={(e) => setMarketPrice(e.target.value)}
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sellerPrice" className="text-card-foreground">
                                Seller Price (₹)
                            </Label>
                            <Input
                                id="sellerPrice"
                                type="number"
                                placeholder="e.g., 2000"
                                value={sellerPrice}
                                onChange={(e) => setSellerPrice(e.target.value)}
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={calculateProfit}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={!category || !marketPrice || !sellerPrice}
                        >
                            Calculate Profit
                        </Button>
                        <Button
                            onClick={resetCalculation}
                            variant="outline"
                            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-card-foreground">Calculation Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-secondary p-4 rounded-lg">
                                <div className="text-sm text-secondary-foreground/70">Market Price</div>
                                <div className="text-2xl font-bold text-secondary-foreground">
                                    ₹{result.marketPrice.toFixed(2)}
                                </div>
                            </div>

                            <div className="bg-secondary p-4 rounded-lg">
                                <div className="text-sm text-secondary-foreground/70">Seller Price</div>
                                <div className="text-2xl font-bold text-secondary-foreground">
                                    ₹{result.sellerPrice.toFixed(2)}
                                </div>
                            </div>

                            <div className="bg-secondary p-4 rounded-lg">
                                <div className="text-sm text-secondary-foreground/70 flex items-center gap-2">
                                    Price Difference
                                    <Badge
                                        variant={result.difference > 0 ? "default" : "destructive"}
                                        className="text-xs"
                                    >
                                        {result.difference > 0 ? "+" : ""}₹{result.difference.toFixed(2)}
                                    </Badge>
                                </div>
                                <div className="text-2xl font-bold text-secondary-foreground">
                                    {result.sellerPrice > result.marketPrice ? "Above Market" : "Below Market"}
                                </div>
                            </div>

                            <div className="bg-accent p-4 rounded-lg">
                                <div className="text-sm text-accent-foreground/70">Dumbdee Percentage</div>
                                <div className="text-2xl font-bold text-accent-foreground">
                                    {result.dumbdeePercentage}%
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border" />

                        <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                            <div className="text-center">
                                <div className="text-sm text-muted-foreground mb-2">
                                    Final Platform Profit (including {result.gst}% GST)
                                </div>
                                <div className="text-4xl font-bold text-primary">₹{result.finalProfit.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground mt-2">
                                    Base: ₹{result.dumbdeePrice.toFixed(2)} + GST: ₹
                                    {(result.finalProfit - result.dumbdeePrice).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={saveCalculation}
                                variant="outline"
                                className="border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save Calculation
                            </Button>
                            <Button
                                onClick={exportData}
                                variant="outline"
                                className="border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Results
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Formula Reference */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-card-foreground">Formula Reference</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-2">Calculation Logic:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• If Seller Price {">"} Market Price → Dumbdee Percentage = 20%</li>
                            <li>• If Seller Price ≤ Market Price → Dumbdee Percentage = 30%</li>
                            <li>• Final Profit = (Seller Price × Dumbdee %) × (1 + GST %)</li>
                            <li>• GST is fixed at 5%</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
