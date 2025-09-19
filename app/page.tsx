import { ProductCalculator } from "@/components/product-calculator"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dumbdee Product Calculator</h1>
          <p className="text-muted-foreground text-lg">Calculate platform profits for your products with precision</p>
        </div>
        <ProductCalculator />
      </div>
    </main>
  )
}
