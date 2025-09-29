"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logger from "@/utils/logger";
import { AlertTriangle, Calculator, Download, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CalculationResult {
    category: string;
    sellerCost: number;
    finalSellerPrice: number;
    averagePrice: number;
    medianPrice: number;
    minPrice: number;
    maxPrice: number;
    totalProducts: number;
    priceDistribution: {
        below500: { count: number; percentage: number };
        between500_1000: { count: number; percentage: number };
        between1000_2000: { count: number; percentage: number };
        above2000: { count: number; percentage: number };
    };
    referencePrice: number;
    minimumMargin: number;
    rtoBuffer: number;
    baseSellingPrice: number;
    finalSellingPrice: number;
    platformProfit: number;
    profitMargin: number;
    competitiveAnalysis: string;
    searchedProduct: string;
    seoTitle: string;
}

export default function ProductCalculator() {
    const [productQuery, setProductQuery] = useState("");
    const [category, setCategory] = useState("");
    const [sellerCost, setSellerCost] = useState("");
    const [finalSellerPrice, setFinalSellerPrice] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [searchError, setSearchError] = useState("");

    const categories = [
        "Men's Clothing",
        "Women's Clothing",
        "Kids' Clothing",
        "Men's Accessories",
        "Women's Accessories",
        "Kids' Accessories",
        "Men's Shoes",
        "Women's Shoes",
        "Kids' Shoes",
        "Electronics",
        "Home & Kitchen",
        "Beauty & Personal Care",
    ];

    const handleSubmit = async () => {
        try {
            setIsSearching(true);
            setResult(null);
            setSearchError("");

            const res = await generateSEOTitle();
            if (!res?.generatedTitle) {
                toast.error("SEO title not found");
                return;
            }

            const resData = await searchProducts(res?.generatedTitle);
            if (!resData) {
                toast.error("Failed to get market data");
                return;
            }

            setResult({
                category: resData?.category,
                sellerCost: resData?.sellerCost,
                finalSellerPrice: resData?.finalSellerPrice,
                averagePrice: resData?.averagePrice,
                medianPrice: resData?.medianPrice,
                minPrice: resData?.minPrice,
                maxPrice: resData?.maxPrice,
                totalProducts: resData?.totalProducts,
                priceDistribution: resData?.priceDistribution,
                referencePrice: resData?.referencePrice,
                minimumMargin: resData?.minimumMargin,
                rtoBuffer: resData?.rtoBuffer,
                baseSellingPrice: resData?.baseSellingPrice,
                finalSellingPrice: resData?.finalSellingPrice,
                platformProfit: resData?.platformProfit,
                profitMargin: resData?.profitMargin,
                competitiveAnalysis: resData?.competitiveAnalysis,
                searchedProduct: resData?.searchedProduct,
                seoTitle: resData?.seoTitle,
            });

            calculateProfit({ result: resData, sellerCost, finalSellerPrice });

            toast.success("Market data fetched successfully");
        } catch (error) {
            logger.error("Error in search", error);
            toast.error("Failed to get market data");
        } finally {
            setIsSearching(false);
        }
    };

    const generateSEOTitle = async (): Promise<{ generatedTitle: string } | undefined> => {
        if (!productQuery || !category) {
            toast.error("Please enter product query and select category");
            return;
        }

        setSearchError("");

        try {
            const response = await fetch("/api/generate-seo-title", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productQuery,
                    category,
                }),
            });

            if (!response.ok) throw new Error(`Gemini API request failed: ${response.status}`);

            const data = await response.json();

            const generatedTitle = data?.data;

            return { generatedTitle };
        } catch (error) {
            console.error("Error generating SEO title:", error);
            setSearchError("Failed to generate SEO title. Please try again.");
        }
    };

    const searchProducts = async (seoTitle: string) => {
        setSearchError("");

        try {
            const serpApiResponse = await fetch("/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    seoTitle,
                }),
            });

            if (!serpApiResponse.ok) throw new Error(`SerpApi request failed: ${serpApiResponse.status}`);

            const data = await serpApiResponse.json();

            // Extract prices from search results
            const products = data?.data?.organic_results || [];
            const pricesData = products
                .filter((product: any) => product.extracted_price)
                .map((product: any) => parseFloat(product.extracted_price.toString().replace(/[₹,]/g, "")));

            if (pricesData.length === 0) throw new Error("No price data found in search results");

            // Calculate price statistics
            const totalProducts = pricesData.length;
            const averagePrice = pricesData.reduce((sum: any, price: any) => sum + price, 0) / totalProducts;
            const sortedPrices = [...pricesData].sort((a, b) => a - b);
            const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
            const minPrice = Math.min(...pricesData);
            const maxPrice = Math.max(...pricesData);

            // Calculate price distribution
            const below500 = pricesData.filter((price: any) => price < 500).length;
            const between500_1000 = pricesData.filter((price: any) => price >= 500 && price < 1000).length;
            const between1000_2000 = pricesData.filter((price: any) => price >= 1000 && price < 2000).length;
            const above2000 = pricesData.filter((price: any) => price >= 2000).length;

            const priceDistribution = {
                below500: { count: below500, percentage: Math.round((below500 / totalProducts) * 100) },
                between500_1000: {
                    count: between500_1000,
                    percentage: Math.round((between500_1000 / totalProducts) * 100),
                },
                between1000_2000: {
                    count: between1000_2000,
                    percentage: Math.round((between1000_2000 / totalProducts) * 100),
                },
                above2000: { count: above2000, percentage: Math.round((above2000 / totalProducts) * 100) },
            };

            return {
                category,
                sellerCost: 0,
                finalSellerPrice: Number.parseFloat(finalSellerPrice) || 0,
                averagePrice,
                medianPrice,
                minPrice,
                maxPrice,
                totalProducts,
                priceDistribution,
                referencePrice: Math.max(averagePrice, medianPrice),
                minimumMargin: 30,
                rtoBuffer: 20,
                baseSellingPrice: 0,
                finalSellingPrice: 0,
                platformProfit: 0,
                profitMargin: 0,
                competitiveAnalysis: "",
                searchedProduct: seoTitle,
                seoTitle,
            };
        } catch (error) {
            console.error("Error searching Market:", error);
            setSearchError("Failed to search Market products. Please check your API key and try again.");
        }
    };

    const calculateProfit = ({
        result,
        sellerCost,
        finalSellerPrice,
    }: {
        result: CalculationResult;
        sellerCost: string;
        finalSellerPrice: string;
    }) => {
        if (!result || !sellerCost || !finalSellerPrice) {
            toast.error("Please enter seller cost, final seller price, and complete the market search");
            return;
        }

        const sc = Number.parseFloat(sellerCost);
        const fsp = Number.parseFloat(finalSellerPrice);

        if (sc <= 0 || fsp <= 0) {
            toast.error("Please enter valid prices");
            return;
        }

        // Step 1: Use average price as reference price
        const referencePrice = result.averagePrice;

        // Step 2: Use final seller price as base selling price
        const minimumMargin = 30;
        const priceWithAddedMargin = fsp * (1 + minimumMargin / 100);

        // Step 3: Add RTO buffer (20%)
        const rtoBuffer = 20;
        const finalSellingPrice = priceWithAddedMargin * (1 + rtoBuffer / 100);

        // Step 4: Calculate platform profit
        const platformProfit = finalSellingPrice - sc;

        // Step 5: Calculate profit margin
        const profitMargin = (platformProfit / sc) * 100;

        // Step 6: Competitive analysis
        let competitiveAnalysis = "";
        if (finalSellingPrice < referencePrice * 0.7) {
            competitiveAnalysis =
                "💡 Very Competitive - Seller's Price is much lower than market average. Consider increasing price for better margins.";
        } else if (finalSellingPrice <= referencePrice) {
            competitiveAnalysis = "✅ Competitive - Seller's Price is within average range";
        } else if (finalSellingPrice <= referencePrice * 1.1) {
            competitiveAnalysis =
                "⚠️ Slightly High - Seller's Price is slightly above average range. Consider market positioning";
        } else {
            competitiveAnalysis = "❌ Too High - Seller's Price is above average range. May struggle to compete";
        }

        setResult({
            ...result,
            sellerCost: sc,
            finalSellerPrice: fsp,
            baseSellingPrice: priceWithAddedMargin,
            finalSellingPrice,
            platformProfit,
            profitMargin,
            competitiveAnalysis,
        });
    };

    const resetCalculation = () => {
        setProductQuery("");
        setCategory("");
        setSellerCost("");
        setFinalSellerPrice("");
        setResult(null);
        setSearchError("");
    };

    const exportData = () => {
        if (!result) return;

        const exportData = `
            Enhanced Product Calculator Results
            =====================================
            Search Query: ${productQuery}
            SEO Title: ${result.seoTitle}
            Product Category: ${result.category}
            Seller Cost: ₹${result.sellerCost.toFixed(2)}
            Final Seller Price: ₹${result.finalSellerPrice.toFixed(2)}

            Market Analysis (${result.totalProducts} products):
            - Average Price: ₹${result.averagePrice.toFixed(2)}
            - Median Price: ₹${result.medianPrice.toFixed(2)}
            - Price Range: ₹${result.minPrice.toFixed(2)} - ₹${result.maxPrice.toFixed(2)}

            Price Distribution:
            - Below ₹500: ${result.priceDistribution.below500.count} products (${
            result.priceDistribution.below500.percentage
        }%)
            - ₹500-₹1000: ${result.priceDistribution.between500_1000.count} products (${
            result.priceDistribution.between500_1000.percentage
        }%)
            - ₹1000-₹2000: ${result.priceDistribution.between1000_2000.count} products (${
            result.priceDistribution.between1000_2000.percentage
        }%)
            - Above ₹2000: ${result.priceDistribution.above2000.count} products (${
            result.priceDistribution.above2000.percentage
        }%)

            Pricing Calculation:
            - Base Selling Price: ₹${result.baseSellingPrice.toFixed(2)}
            - RTO Buffer: ${result.rtoBuffer}%
            - Final Selling Price: ₹${result.finalSellingPrice.toFixed(2)}

            Platform Metrics:
            - Platform Profit: ₹${result.platformProfit.toFixed(2)}
            - Profit Margin: ${result.profitMargin.toFixed(2)}%
            - Competitive Analysis: ${result.competitiveAnalysis}

            Generated: ${new Date().toLocaleString()}
        `;

        const blob = new Blob([exportData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `enhanced-product-calculation-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
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
                            <Label htmlFor="productQuery" className="text-card-foreground">
                                Product Search Query *
                            </Label>
                            <Input
                                id="productQuery"
                                type="text"
                                placeholder="e.g., red shirt 3xl men"
                                value={productQuery}
                                onChange={(e) => setProductQuery(e.target.value)}
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                                disabled={isSearching}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-card-foreground">
                                Product Category *
                            </Label>
                            <Select value={category} onValueChange={setCategory} disabled={isSearching}>
                                <SelectTrigger className="bg-input border-border text-foreground w-full">
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
                    </div>

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
                                disabled={isSearching}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="finalSellerPrice" className="text-card-foreground">
                                Final Seller's Price (₹) *
                            </Label>
                            <Input
                                id="finalSellerPrice"
                                type="number"
                                placeholder="e.g., 450"
                                value={finalSellerPrice}
                                onChange={(e) => setFinalSellerPrice(e.target.value)}
                                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                                disabled={isSearching}
                            />
                        </div>
                    </div>

                    {searchError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="text-red-800 text-sm">{searchError}</div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSearching}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            {isSearching ? "Searching..." : "Calculate Market Analysis"}
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
                    {/* Market Analysis */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-card-foreground">
                                Price Analysis for "{result.searchedProduct}"
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="text-sm text-blue-600">Average Price</div>
                                    <div className="text-2xl font-bold text-blue-800">
                                        ₹{result.averagePrice.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-blue-600">From {result.totalProducts} products</div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="text-sm text-green-600">Median Price</div>
                                    <div className="text-2xl font-bold text-green-800">
                                        ₹{result.medianPrice.toFixed(0)}
                                    </div>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="text-sm text-purple-600">Price Range(min - max)</div>
                                    <div className="text-lg font-bold text-purple-800">
                                        ₹{result.minPrice.toFixed(0)} - ₹{result.maxPrice.toFixed(0)}
                                    </div>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <div className="text-sm text-orange-600 flex items-center gap-2">
                                        Competitive Analysis
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div className="text-sm font-medium text-orange-800 mt-1">
                                        {result.competitiveAnalysis || "Calculate pricing first"}
                                    </div>
                                </div>
                            </div>

                            {/* Price Distribution */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="font-semibold text-slate-800 mb-3">Price Distribution</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-black">
                                    <div>
                                        <span className="text-slate-600">Below ₹500:</span>
                                        <span className="ml-2 font-semibold">
                                            {result.priceDistribution.below500.count} products (
                                            {result.priceDistribution.below500.percentage}%)
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">₹500-₹1000:</span>
                                        <span className="ml-2 font-semibold">
                                            {result.priceDistribution.between500_1000.count} products (
                                            {result.priceDistribution.between500_1000.percentage}%)
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">₹1000-₹2000:</span>
                                        <span className="ml-2 font-semibold">
                                            {result.priceDistribution.between1000_2000.count} products (
                                            {result.priceDistribution.between1000_2000.percentage}%)
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Above ₹2000:</span>
                                        <span className="ml-2 font-semibold">
                                            {result.priceDistribution.above2000.count} products (
                                            {result.priceDistribution.above2000.percentage}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Breakdown */}
                    {result.platformProfit > 0 && (
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-card-foreground">Pricing Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="bg-secondary p-4 rounded-lg">
                                        <div className="text-sm text-secondary-foreground/70">Final Seller Price</div>
                                        <div className="text-xl font-bold text-secondary-foreground">
                                            ₹{result.sellerCost.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <div className="text-sm text-yellow-600">Base Price (30% margin)</div>
                                        <div className="text-xl font-bold text-yellow-800">
                                            ₹{result.baseSellingPrice.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                        <div className="text-sm text-red-600">+ RTO Buffer (20%)</div>
                                        <div className="text-xl font-bold text-red-800">
                                            ₹{(result.finalSellingPrice - result.baseSellingPrice).toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                                        <div className="text-sm text-primary">Final Selling Price</div>
                                        <div className="text-2xl font-bold text-primary">
                                            ₹{result.finalSellingPrice.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <div className="text-sm text-green-600">Platform Profit</div>
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

                    {/* Actions */}
                    <Card className="bg-card border-border">
                        <CardContent className="pt-6">
                            <div className="flex gap-3 justify-center">
                                <Button
                                    onClick={exportData}
                                    variant="outline"
                                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Results
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Formula Reference */}
            <Card className="bg-card border-border">
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 pl-10 rounded-lg">
                        <ul className="text-sm text-muted-foreground space-y-1 list-decimal">
                            <li>Generate SEO-optimized title using Gemini AI</li>
                            <li>Search market using SerpApi with optimized title</li>
                            <li>Extract and analyze price data from search results</li>
                            <li>Calculate market statistics (average, median, distribution)</li>
                            <li>Use seller's final price as base selling price</li>
                            <li>Add 20% RTO buffer to base price</li>
                            <li>Compare final price with market average for competitiveness</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
