import os
import psycopg2
from dotenv import load_dotenv

# Carrega configurações do ambiente
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

def setup_database():
    """Inicializa o esquema do banco de dados relacional (PostgreSQL)"""
    if not DATABASE_URL:
        print("Erro: DATABASE_URL não encontrada no ambiente.")
        return

    # Adaptação para SQLAlchemy/psycopg2
    connection_url = DATABASE_URL
    if connection_url.startswith("postgres://"):
        connection_url = connection_url.replace("postgres://", "postgresql://", 1)

    conn = psycopg2.connect(connection_url)
    conn.autocommit = True
    cursor = conn.cursor()

    print("Limpando esquema existente...")
    tables = [
        "repasses_convenios", 
        "pagamentos_prestacao", 
        "controle_fiscalizacao", 
        "contratos", 
        "entidades_base"
    ]
    for t in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {t} CASCADE;")

    print("Criando novas tabelas (Arquitetura Expandida)...")
    ddl = """
    CREATE TABLE entidades_base (
        cnpj VARCHAR(14) PRIMARY KEY,
        razao_social VARCHAR(255) NOT NULL,
        uf VARCHAR(2),
        municipio VARCHAR(255),
        telefone VARCHAR(255),
        email VARCHAR(255),
        endereco TEXT,
        cep VARCHAR(20)
    );

    CREATE TABLE contratos (
        id SERIAL PRIMARY KEY,
        cnpj_entidade VARCHAR(14) REFERENCES entidades_base(cnpj) ON DELETE CASCADE,
        comunidade_terapeutica VARCHAR(255),
        contrato_ano VARCHAR(50),
        numero_contrato VARCHAR(50), 
        ano_contrato INT,
        processo_mae VARCHAR(100),
        dt_inicial_ct DATE,
        dt_inicial_ta1 DATE,
        dt_inicial_ta2 DATE,
        dt_inicial_ta3 DATE,
        dt_inicial_ta4 DATE,
        dt_inicial_ta5 DATE,
        vagas_contratadas INT,
        vagas_adulto_masculino INT,
        vagas_adulto_feminino INT,
        vagas_maes INT,
        previsao_recurso_mensal NUMERIC,
        previsao_recurso_anual NUMERIC,
        valor_marco_dezembro NUMERIC
    );

    CREATE TABLE controle_fiscalizacao (
        id SERIAL PRIMARY KEY,
        cnpj_entidade VARCHAR(14) REFERENCES entidades_base(cnpj) ON DELETE CASCADE,
        numero_contrato VARCHAR(50),
        data_fiscalizacao_texto VARCHAR(100),
        localidade VARCHAR(255),
        uf VARCHAR(2),
        processo_mae VARCHAR(100),
        telefone VARCHAR(100),
        email VARCHAR(255),
        endereco TEXT,
        cep VARCHAR(20),
        processo_pagamento VARCHAR(100),
        vagas_contratadas INT,
        adulto_masculino INT,
        adulto_feminino INT,
        maes INT,
        previsao_recurso_ano NUMERIC,
        previsao_recurso_mes NUMERIC
    );

    CREATE TABLE pagamentos_prestacao (
        id SERIAL PRIMARY KEY,
        cnpj_entidade VARCHAR(14) REFERENCES entidades_base(cnpj) ON DELETE CASCADE,
        comunidade_terapeutica VARCHAR(255),
        contrato_ano VARCHAR(50),
        numero_contrato VARCHAR(50),
        ano INT,
        processo_mae VARCHAR(100),
        processo_pagamento VARCHAR(100),
        pagamento_dez_status VARCHAR(50),
        formulario_pagamento VARCHAR(255),
        data_envio_sgt VARCHAR(100),
        valor_dezembro NUMERIC
    );

    CREATE TABLE repasses_convenios (
        id SERIAL PRIMARY KEY,
        cnpj_entidade VARCHAR(14) REFERENCES entidades_base(cnpj) ON DELETE SET NULL,
        convenente_nome_original VARCHAR(255),
        uf VARCHAR(2),
        municipio VARCHAR(255),
        numero_parceria VARCHAR(50),
        objeto TEXT,
        numero_processo VARCHAR(100),
        vigencia_inicio DATE,
        vigencia_fim_texto VARCHAR(100),
        ano INT,
        programa VARCHAR(255),
        tipo_parceria VARCHAR(255),
        valor_global NUMERIC,
        valor_repasse NUMERIC,
        valor_contrapartida NUMERIC,
        financeiro_origem VARCHAR(255),
        autor_emenda VARCHAR(255),
        numero_emenda VARCHAR(100),
        data_assinatura DATE,
        data_publicacao VARCHAR(100),
        conta_regularizada VARCHAR(50),
        data_regularizacao_conta VARCHAR(100),
        deposito_contrapartida VARCHAR(255),
        situacao_tecnica VARCHAR(255),
        status_pagamento VARCHAR(100),
        previsao_pagamento TEXT,
        data_desembolso TEXT,
        situacional_pagamento VARCHAR(255),
        situacional_pagamento_2 VARCHAR(255),
        tecnico_responsavel VARCHAR(255),
        ajustes_pt_ultimo_doc TEXT,
        tas_ultimo_doc TEXT,
        rendimentos_ultimo_doc TEXT,
        tipo_fomento VARCHAR(50),
        solicitacao_ta VARCHAR(255),
        valor_total_repasse_obs NUMERIC,
        desembolso_obs TEXT,
        dias_atraso VARCHAR(100),
        valor_desembolsado NUMERIC,
        data_ultimo_desembolso DATE,
        valor_a_desembolsar NUMERIC,
        valor_global_auto NUMERIC,
        quantidade_tas_2022 INT,
        quantidade_tas_2023 INT,
        quantidade_tas_2024 INT,
        quantidade_tas_2025 INT,
        quantidade_tas_2026 INT,
        data_assinatura_ultimo_ta DATE,
        gnd VARCHAR(50),
        valor_gasto NUMERIC,
        data_contato DATE,
        observacao_contato TEXT,
        dias_sem_contato VARCHAR(100),
        saldo_executar_desembolso NUMERIC,
        saldo_executar_global NUMERIC,
        media_execucao NUMERIC,
        percentual_total_execucao NUMERIC
    );
    """
    cursor.execute(ddl)
    print("Banco de dados reinicializado com sucesso.")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    setup_database()
