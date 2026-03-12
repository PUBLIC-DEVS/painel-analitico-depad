import os
import io
import pandas as pd
from dotenv import load_dotenv
from office365.runtime.auth.client_credential import ClientCredential
from office365.sharepoint.client_context import ClientContext
from office365.sharepoint.files.file import File
from supabase import create_client, Client

# Carrega variáveis de ambiente (localmente lerá do .env, no GitHub Actions virá do Secrets)
load_dotenv()

# --- Configurações SharePoint ---
SP_SITE_URL = os.environ.get("SHAREPOINT_SITE_URL")
SP_CLIENT_ID = os.environ.get("SHAREPOINT_CLIENT_ID")
SP_CLIENT_SECRET = os.environ.get("SHAREPOINT_CLIENT_SECRET")

# Caminhos das planilhas no SharePoint (ajuste de acordo com o seu ambiente)
SP_PLANILHA_1_PATH = "/sites/SEU_SITE/Documentos/Planilha1.xlsx"
SP_PLANILHA_2_PATH = "/sites/SEU_SITE/Documentos/Planilha2.xlsx"
SP_PLANILHA_3_PATH = "/sites/SEU_SITE/Documentos/Planilha3.xlsx"

# --- Configurações Supabase ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def connect_to_sharepoint():
    """Conecta no SharePoint usando Client ID e Secret"""
    print("Conectando ao SharePoint via Client Credentials...")
    try:
        ctx = ClientContext(SP_SITE_URL).with_credentials(
            ClientCredential(SP_CLIENT_ID, SP_CLIENT_SECRET)
        )
        web = ctx.web
        ctx.load(web)
        ctx.execute_query()
        print(f"Conectado com sucesso ao site: {web.properties['Title']}")
        return ctx
    except Exception as e:
        print(f"Erro ao conectar no SharePoint: {e}")
        raise e

def read_excel_from_sharepoint(ctx, file_path):
    """Lê um arquivo do Excel do SharePoint e retorna como um DataFrame do Pandas"""
    print(f"Lendo arquivo '{file_path}'...")
    try:
        response = File.open_binary(ctx, file_path)
        # Salva o binário baixado em memória
        bytes_file_obj = io.BytesIO(response.content)
        # Lê com pandas
        df = pd.read_excel(bytes_file_obj)
        print(f"Arquivo lido. {len(df)} linhas identificadas.")
        return df
    except Exception as e:
        print(f"Erro ao ler '{file_path}': {e}")
        raise e

def validate_and_merge_data(df1: pd.DataFrame, df2: pd.DataFrame, df3: pd.DataFrame) -> pd.DataFrame:
    """Implementa as regras de negócio para validar e integrar as planilhas"""
    print("Iniciando validações e cruzamento das planilhas...")
    
    # Merge the dataframes on a common key, e.g., 'ID' or 'CNPJ'.
    # For robust merging, we'll use an outer join to keep all records from all dataframes
    # and then identify any non-matching records if necessary.
    
    # Start with df1 as the primary base
    df_merged = df1.copy()

    # Merge with df2
    # Assuming 'ID' is the common key based on the example data.
    # Use 'outer' merge to keep all records and identify missing matches.
    df_merged = pd.merge(df_merged, df2, on='ID', how='outer', suffixes=('_df1', '_df2'))
    
    # Merge with df3
    df_merged = pd.merge(df_merged, df3, on='ID', how='outer', suffixes=('_merged', '_df3'))

    # --- Data Validation ---
    print("Executando validações nos dados consolidados...")

    # 1. Check for duplicate IDs after merging (should not happen with outer merge unless IDs were duplicated in source)
    if df_merged['ID'].duplicated().any():
        print("ALERTA: IDs duplicados encontrados após a junção. Verifique a fonte de dados.")
        # Optionally, log or handle these duplicates, e.g., keep first occurrence
        df_merged.drop_duplicates(subset=['ID'], inplace=True)

    # 2. Check for missing critical values (e.g., Name, Value, Status based on example DFs)
    # Define critical columns that should not be null in the final dataset
    critical_columns = ['ID', 'Nome', 'Valor', 'Status'] # Adjust based on actual expected columns

    for col in critical_columns:
        if col in df_merged.columns and df_merged[col].isnull().any():
            print(f"ALERTA: Valores nulos encontrados na coluna crítica '{col}'.")
            # Option to drop rows with nulls in critical columns, or fill them
            # For this example, we'll drop rows where 'ID' is null as it's the merge key
            if col == 'ID':
                df_merged.dropna(subset=[col], inplace=True)
                print(f"Linhas com ID nulo foram removidas. Restam {len(df_merged)} linhas.")
            # For other critical columns, you might choose to fill with a default or log more aggressively
            # For now, we'll just report.

    # 3. Data Type Coercion/Cleaning (Example: if CNPJ was present, standardize it)
    # if 'CNPJ' in df_merged.columns:
    #     df_merged['CNPJ'] = df_merged['CNPJ'].astype(str).str.replace(r'\D', '', regex=True).str.zfill(14)
    #     print("CNPJ formatado.")
        
    # Final consolidated DataFrame
    df_final = df_merged
    
    print(f"Validação e cruzamento concluídos. Base consolidada final possui {len(df_final)} linhas.")
    return df_final

def save_to_supabase(df: pd.DataFrame, table_name: str):
    """Salva os dados consolidados no Supabase"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Credenciais do Supabase não encontradas. Imprimindo apenas no log.")
        print(df.head())
        return
        
    print(f"Salvando dados na tabela '{table_name}' do Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Converte tipos problemáticos para JSON suportados (ex: NaNs para None)
    df = df.where(pd.notnull(df), None)
    
    # Converte DataFrame para lista de dicionários
    records = df.to_dict('records')
    
    # Executa UPSERT na tabela especificada
    try:
        # Se for upsert, é importante a tabela ter PK (Primary Key).
        response = supabase.table(table_name).upsert(records).execute()
        print(f"Inserção/Atualização em '{table_name}' concluída com sucesso.")
    except Exception as e:
        print(f"Erro ao salvar no banco: {e}")

def main():
    try:
        # 1. Conecta ao SharePoint
        ctx = connect_to_sharepoint()
        
        # 2. Faz o download das planilhas em DataFrames
        # TODO: Crie/Ajuste os caminhos válidos dos arquivos no SharePoint la em cima
        # df1 = read_excel_from_sharepoint(ctx, SP_PLANILHA_1_PATH)
        # df2 = read_excel_from_sharepoint(ctx, SP_PLANILHA_2_PATH)
        # df3 = read_excel_from_sharepoint(ctx, SP_PLANILHA_3_PATH)
        
        # --- Simulação para evitar erro de teste se arquivos não existirem:
        df1 = pd.DataFrame({"ID": [1, 2], "Nome": ["João", "Maria"]})
        df2 = pd.DataFrame({"ID": [1, 2], "Valor": [100, 200]})
        df3 = pd.DataFrame({"ID": [1, 2], "Status": ["Ativo", "Ativo"]})
        
        # 3. Faz o cruzamento e as validações cruzando as bases
        df_final = validate_and_merge_data(df1, df2, df3)
        
        # 4. Salva no banco Next.js
        # TODO: Altere "tabela_consolidada" para a sua tabela real do Supabase
        save_to_supabase(df_final, "tabela_consolidada")
        
        print("\nOperação diária concluída.")

    except Exception as e:
        print(f"\nOcorreu um erro fatal no fluxo principal: {e}")

if __name__ == "__main__":
    main()
