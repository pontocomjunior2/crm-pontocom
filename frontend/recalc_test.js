
const calculateOrderMargins = (vendaValor, cacheValor) => {
    const venda = parseFloat(vendaValor) || 0;
    const cache = parseFloat(cacheValor) || 0;

    // Imposto: 10% do valor da venda
    const imposto = venda * 0.10;

    // Base para comissão: Valor da Venda - Cachê
    const baseComissao = venda - cache;

    // Comissão: 4% sobre a base
    const comissao = baseComissao * 0.04;

    // Margem de Lucro: Venda - Imposto - Cachê - Comissão
    const margem = venda - imposto - cache - comissao;

    // Margem percentual
    const margemPercentual = venda > 0 ? (margem / venda) * 100 : 0;

    return {
        imposto: imposto.toFixed(2),
        comissao: comissao.toFixed(2),
        margem: margem.toFixed(2),
        margemPercentual: margemPercentual.toFixed(2),
        baseComissao: baseComissao.toFixed(2)
    };
};

const formatCalculationDisplay = (calculations) => {
    return {
        imposto: `R$ ${parseFloat(calculations.imposto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        comissao: `R$ ${parseFloat(calculations.comissao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        margem: `R$ ${parseFloat(calculations.margem).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        margemPercentual: `${parseFloat(calculations.margemPercentual).toFixed(1)}%`
    };
};

// Test Case from Image
// Venda: 1.00
// Cache: 50.00
const inputVenda = 1.00;
const inputCache = 50.00;

console.log("Inputs:", { inputVenda, inputCache });
const results = calculateOrderMargins(inputVenda, inputCache);
console.log("Raw Results:", results);
const formatted = formatCalculationDisplay(results);
console.log("Formatted Results:", formatted);

// Test Case Hypothesis: What if inputs are 100?
console.log("\n--- Hypothesis: Inputs are 100x ---");
const results100 = calculateOrderMargins(100, 5000); // If 50 becomes 5000? No, image says 50.
const resultsMixed = calculateOrderMargins(100, 50);
console.log("Mixed (V=100, C=50):", formatCalculationDisplay(resultsMixed));
