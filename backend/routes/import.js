const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { XMLParser } = require('fast-xml-parser');
const { clientSelectionCache } = require('../utils/cache');
const parser = new XMLParser();

router.post('/clients', async (req, res) => {
    try {
        const { xmlData } = req.body;

        if (!xmlData) {
            return res.status(400).json({ error: 'XML data is required' });
        }

        const jsonObj = parser.parse(xmlData);

        if (!jsonObj.Clientes || !jsonObj.Clientes.cliente) {
            return res.status(400).json({ error: 'Formato de XML inválido ou sem clientes' });
        }

        // Normalize to array
        let clientsData = jsonObj.Clientes.cliente;
        if (!Array.isArray(clientsData)) {
            clientsData = [clientsData];
        }

        console.log(`Processing ${clientsData.length} clients from XML...`);

        const mappedClients = clientsData.map(c => ({
            name: String(c.Nome || ''),
            razaoSocial: c.RazaoSocial ? String(c.RazaoSocial) : null,
            cnpj_cpf: String(c.CNPJ || c.CPF || '').replace(/[^\d]/g, ''), // Clean mask
            dataCriacao: c.DataCriacao ? String(c.DataCriacao) : null,
            status: c.Status ? String(c.Status).toLowerCase() : 'ativado',
            inscricaoEstadual: c.InscricaoEstadual ? String(c.InscricaoEstadual) : null,
            emailPrincipal: c.Emailprincipal ? String(c.Emailprincipal) : null,
            telefonePrincipal: c.TelefonePrincipal ? String(c.TelefonePrincipal) : null,
            cep: c.CEP ? String(c.CEP) : null,
            estado: c.Estado ? String(c.Estado) : null,
            cidade: c.Cidade ? String(c.Cidade) : null,
            endereco: c.Endereco ? String(c.Endereco) : null,
            numero: c.Numero ? String(c.Numero) : null,
            bairro: c.Bairro ? String(c.Bairro) : null,
            complemento: c.Complemento ? String(c.Complemento) : null,
            nomeContato: c.NomeContato ? String(c.NomeContato) : null,
            emailContato: c.EmailContato ? String(c.EmailContato) : null,
            dataAniversario: c.DataAniversario ? String(c.DataAniversario) : null,
            observacoes: c.Observações ? String(c.Observações) : null,
        })).filter(c => c.name && c.cnpj_cpf); // Basic validation

        // Use createMany with skipDuplicates: true
        const result = await prisma.client.createMany({
            data: mappedClients,
            skipDuplicates: true,
        });

        // Invalidate cache
        clientSelectionCache.clear();

        res.json({
            success: true,
            count: result.count,
            message: `${result.count} clientes importados com sucesso.`
        });

    } catch (error) {
        console.error('Import Error:', error);
        res.status(500).json({ error: 'Erro ao processar importação', details: error.message });
    }
});

module.exports = router;
