export type ProductVariantSummary = {
  id?: string | null
  price?: number | null
  original_price?: number | null
  stock_quantity?: number | null
  is_active?: boolean | null
}

export type SelectedProductVariantSummary = {
  id: string | null
  price: number | null
  original_price: number | null
}

function toNumber(value: number | null | undefined): number | null {
  if (typeof value !== 'number') return null
  if (!Number.isFinite(value)) return null

  return value
}

export function selectDisplayVariant(
  variants: ProductVariantSummary[] | null | undefined
): SelectedProductVariantSummary | null {
  const activeVariants = (variants || []).filter(
    variant => variant.is_active !== false && toNumber(variant.price) !== null
  )

  if (activeVariants.length === 0) return null

  const inStockVariants = activeVariants.filter(
    variant => (variant.stock_quantity || 0) > 0
  )
  const candidates = inStockVariants.length > 0 ? inStockVariants : activeVariants
  const [selectedVariant] = [...candidates].sort((a, b) => {
    const priceDifference = (toNumber(a.price) || 0) - (toNumber(b.price) || 0)
    if (priceDifference !== 0) return priceDifference

    return (b.stock_quantity || 0) - (a.stock_quantity || 0)
  })

  return {
    id: selectedVariant.id || null,
    price: toNumber(selectedVariant.price),
    original_price: toNumber(selectedVariant.original_price),
  }
}
