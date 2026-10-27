export const pricePerKg = f => f.preco_kg ?? (f.preco_pago != null && f.peso_total_g > 0 ? f.preco_pago * 1000 / f.peso_total_g : null);
export const costPerGram = f => pricePerKg(f) != null ? pricePerKg(f) / 1000 : f.custo_por_grama;

