const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
    const jsonPath = path.join(__dirname, '..', 'unified_data.json');

    if (!fs.existsSync(jsonPath)) {
        console.error('Arquivo JSON não encontrado em:', jsonPath);
        return;
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(rawData);

    let imported = 0;
    let errors = 0;
    const nameToId = new Map();

    console.log(`Iniciando importação de ${data.clients.length} clientes...`);

    for (const c of data.clients) {
        try {
            const cnpj_cpf = (c.CNPJ || c.CPF || `ID-${Math.random().toString(36).substr(2, 9)}`).toString();

            const client = await prisma.client.upsert({
                where: { cnpj_cpf: cnpj_cpf },
                update: {
                    name: c.Nome?.toString() || 'Sem Nome',
                    razaoSocial: c.RazaoSocial?.toString() || null,
                    dataCriacao: c.DataCriacao?.toString() || null,
                    status: c.Status?.toString() || 'ativado',
                    inscricaoEstadual: c.InscricaoEstadual?.toString() || null,
                    emailPrincipal: c.Emailprincipal?.toString() || null,
                    telefonePrincipal: c.TelefonePrincipal?.toString() || null,
                    cep: c.CEP?.toString() || null,
                    estado: c.Estado?.toString() || null,
                    cidade: c.Cidade?.toString() || null,
                    endereco: c.Endereco?.toString() || null,
                    numero: c.Numero?.toString() || null,
                    bairro: c.Bairro?.toString() || null,
                    complemento: c.Complemento?.toString() || null,
                    nomeContato: c.NomeContato?.toString() || null,
                    emailContato: c.EmailContato?.toString() || null,
                    dataAniversario: c.DataAniversario?.toString() || null,
                    observacoes: c.Observações?.toString() || c.observacoes?.toString() || null,
                    totalVendas: c.TotalVendas || 0,
                    dataUltimaVenda: c.DataUltimaVenda || null,
                    salesCount: c.SalesCount || 0,
                },
                create: {
                    name: c.Nome?.toString() || 'Sem Nome',
                    razaoSocial: c.RazaoSocial?.toString() || null,
                    cnpj_cpf: cnpj_cpf,
                    dataCriacao: c.DataCriacao?.toString() || null,
                    status: c.Status?.toString() || 'ativado',
                    inscricaoEstadual: c.InscricaoEstadual?.toString() || null,
                    emailPrincipal: c.Emailprincipal?.toString() || null,
                    telefonePrincipal: c.TelefonePrincipal?.toString() || null,
                    cep: c.CEP?.toString() || null,
                    estado: c.Estado?.toString() || null,
                    cidade: c.Cidade?.toString() || null,
                    endereco: c.Endereco?.toString() || null,
                    numero: c.Numero?.toString() || null,
                    bairro: c.Bairro?.toString() || null,
                    complemento: c.Complemento?.toString() || null,
                    nomeContato: c.NomeContato?.toString() || null,
                    emailContato: c.EmailContato?.toString() || null,
                    dataAniversario: c.DataAniversario?.toString() || null,
                    observacoes: c.Observações?.toString() || c.observacoes?.toString() || null,
                    totalVendas: c.TotalVendas || 0,
                    dataUltimaVenda: c.DataUltimaVenda || null,
                    salesCount: c.SalesCount || 0,
                }
            });
            nameToId.set(c.Nome, client.id);
            imported++;
            if (imported % 100 === 0) console.log(`${imported} clientes processados...`);
        } catch (error) {
            console.error(`Erro ao importar cliente ${c.Nome}:`, error.message);
            errors++;
        }
    }

    console.log(`Importação de clientes concluída: ${imported} sucessos.`);

    // --- Import Orders ---
    console.log(`Iniciando importação de ${data.sales_history.length} pedidos/vendas...`);

    // Clear existing historical orders to avoid duplicates on re-run
    await prisma.order.deleteMany({ where: { status: "VENDA" } });

    const batchSize = 500;
    let ordersCreated = 0;

    for (let i = 0; i < data.sales_history.length; i += batchSize) {
        const batch = data.sales_history.slice(i, i + batchSize).map(s => {
            const clientId = nameToId.get(s.matched_name);
            if (!clientId) return null;

            // Parse date "DD/MM/YYYY" to Date object
            let dateObj = new Date();
            if (s.data) {
                const parts = s.data.split('/');
                if (parts.length === 3) {
                    dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    // Check for invalid date
                    if (isNaN(dateObj.getTime())) dateObj = new Date();
                }
            }

            return {
                clientId: clientId,
                date: dateObj,
                title: `Venda Ref. ${s.numero_venda || 'N/A'}`,
                locutor: s.vendedor || 'Sistema',
                tipo: 'PRODUZIDO', // Default for historical
                cacheValor: 0,
                vendaValor: s.valor_liquido || 0,
                status: 'VENDA',
                numeroVenda: s.numero_venda?.toString() || null,
                faturado: true,
                entregue: true,
                pago: true
            };
        }).filter(Boolean);

        if (batch.length > 0) {
            await prisma.order.createMany({
                data: batch,
                skipDuplicates: true
            });
            ordersCreated += batch.length;
            console.log(`${ordersCreated} pedidos importados...`);
        }
    }

    console.log(`Processo finalizado: ${imported} clientes, ${ordersCreated} vendas importadas.`);
}

importData()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
