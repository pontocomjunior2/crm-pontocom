import csv
import json
import os
import xml.etree.ElementTree as ET
from datetime import datetime
try:
    from thefuzz import fuzz, process
    HAS_FUZZ = True
except ImportError:
    HAS_FUZZ = False

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XML_PATH = os.path.join(BASE_DIR, "Modelo Base de importação de Clientes Conta Azul.xml")
CSV_PATH = os.path.join(BASE_DIR, "vendas.csv")
OUTPUT_JSON = os.path.join(BASE_DIR, "unified_data.json")

def clean_currency(value):
    if not value or value == "(em branco)":
        return 0.0
    # Handle "1.127,50" -> 1127.50
    # Remove quotes, remove thousand separator (.), replace decimal separator (,) with dot
    clean_val = value.replace('"', '').replace('.', '').replace(',', '.')
    try:
        return float(clean_val)
    except ValueError:
        return 0.0

def parse_csv():
    sales = []
    current_sale_num = None
    current_nf = None
    current_client = None
    current_vendor = None
    
    if not os.path.exists(CSV_PATH):
        print(f"Erro: Arquivo CSV não encontrado em {CSV_PATH}")
        return []

    with open(CSV_PATH, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Propagate values for multi-line sales
            if row['Número da venda'] and row['Número da venda'].strip():
                current_sale_num = row['Número da venda'].strip()
            if row['Nota fiscal/RPS'] and row['Nota fiscal/RPS'].strip():
                current_nf = row['Nota fiscal/RPS'].strip()
            if row['Cliente'] and row['Cliente'].strip():
                current_client = row['Cliente'].strip()
            if row['Vendedor'] and row['Vendedor'].strip():
                current_vendor = row['Vendedor'].strip()
            
            if not current_client or "Total geral" in current_client or row.get('Número da venda') == "Total geral":
                continue
                
            sale = {
                'numero_venda': current_sale_num,
                'nf': current_nf,
                'cliente': current_client,
                'vendedor': current_vendor,
                'data': row['Data da venda'],
                'valor_bruto': clean_currency(row['Valor bruto']),
                'valor_liquido': clean_currency(row['Valor líquido'])
            }
            sales.append(sale)
    return sales

def parse_xml():
    if not os.path.exists(XML_PATH):
        print(f"Erro: Arquivo XML não encontrado em {XML_PATH}")
        return []
        
    tree = ET.parse(XML_PATH)
    root = tree.getroot()
    clients = []
    for client_node in root.findall('cliente'):
        client_data = {}
        for child in client_node:
            client_data[child.tag] = child.text if child.text else ""
        clients.append(client_data)
    return clients

def merge_data(xml_clients, csv_sales):
    # Index xml clients for matching
    # We use a set for fuzzy matching names
    client_name_to_data = {}
    razao_to_data = {}
    
    for c in xml_clients:
        name = c.get('Nome', '').strip().upper()
        razao = c.get('RazaoSocial', '').strip().upper()
        if name: client_name_to_data[name] = c
        if razao: razao_to_data[razao] = c
    
    # Process sales to group by client
    sales_by_client = {}
    for s in csv_sales:
        name = s['cliente'].strip().upper()
        if name not in sales_by_client:
            sales_by_client[name] = []
        sales_by_client[name].append(s)
    
    all_known_names = list(set(list(client_name_to_data.keys()) + list(razao_to_data.keys())))
    
    final_clients = {c.get('Nome', ''): c for c in xml_clients}
    
    processed_csv_clients = set()

    for csv_name, sales in sales_by_client.items():
        target_client = client_name_to_data.get(csv_name) or razao_to_data.get(csv_name)
        
        if not target_client and HAS_FUZZ:
            best_match, score = process.extractOne(csv_name, all_known_names, scorer=fuzz.token_sort_ratio)
            if score > 90:
                target_client = client_name_to_data.get(best_match) or razao_to_data.get(best_match)
        
        # Calculate enrichment data
        total_vendas = sum(s['valor_liquido'] for s in sales)
        dates = []
        for s in sales:
            if s['data']:
                try:
                    dates.append(datetime.strptime(s['data'], '%d/%m/%Y'))
                except ValueError:
                    pass
        
        ultima_venda = max(dates).strftime('%d/%m/%Y') if dates else ""
        criacao_venda = min(dates).strftime('%d/%m/%Y') if dates else ""
        
        target_name = target_client['Nome'] if target_client else s['cliente']
        
        for sale_rec in sales:
            sale_rec['matched_name'] = target_name
            
        if target_client:
            target_client['TotalVendas'] = total_vendas
            target_client['DataUltimaVenda'] = ultima_venda
            target_client['SalesCount'] = len(sales)
        else:
            # New client
            new_client = {
                'Nome': s['cliente'], # Use original casing
                'Status': 'ativado',
                'DataCriacao': criacao_venda,
                'TotalVendas': total_vendas,
                'DataUltimaVenda': ultima_venda,
                'SalesCount': len(sales),
                'CNPJ': '',
                'CPF': '',
                'Emailprincipal': '',
                'TelefonePrincipal': ''
            }
            final_clients[s['cliente']] = new_client
            
    return list(final_clients.values()), csv_sales

def main():
    print("Iniciando unificação de dados...")
    csv_sales = parse_csv()
    print(f"Lidas {len(csv_sales)} linhas de venda do CSV.")
    
    xml_clients = parse_xml()
    print(f"Lidos {len(xml_clients)} clientes do XML.")
    
    merged_clients, all_sales = merge_data(xml_clients, csv_sales)
    print(f"Total de clientes unificados: {len(merged_clients)}")
    
    # Standardize output for Prisma
    output = {
        'clients': merged_clients,
        'sales_history': all_sales
    }
    
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Sucesso! Dados salvos em {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
