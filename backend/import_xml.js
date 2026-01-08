const { PrismaClient } = require('@prisma/client');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function importClients() {
    const xmlPath = path.join(__dirname, '..', 'Modelo Base de importação de Clientes Conta Azul.xml');

    if (!fs.existsSync(xmlPath)) {
        console.error('Arquivo XML não encontrado em:', xmlPath);
        return;
    }

    const xmlData = fs.readFileSync(xmlPath, 'utf-8');
    const parser = new XMLParser();
    const jsonObj = parser.parse(xmlData);

    const clients = jsonObj.Clientes.cliente;
    console.log(`Encontrados ${clients.length} clientes no XML.`);

    let imported = 0;
    let skipped = 0;

    for (const c of clients) {
        try {
            const cnpj_cpf = (c.CNPJ || c.CPF || `ID-${Math.random().toString(36).substr(2, 9)}`).toString();

            await prisma.client.upsert({
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
                    observacoes: c.Observações?.toString() || null,
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
                    observacoes: c.Observações?.toString() || null,
                }
            });
            imported++;
        } catch (error) {
            console.error(`Erro ao importar cliente ${c.Nome}:`, error.message);
            skipped++;
        }
    }

    console.log(`Importação concluída: ${imported} importados, ${skipped} ignorados.`);
}

importClients()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
