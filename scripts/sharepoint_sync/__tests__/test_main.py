import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
import io
from datetime import date
import logging

# Desabilitar o logging durante os testes para evitar poluir a saída
logging.disable(logging.CRITICAL)

from scripts.sharepoint_sync.main import (
    normalize_column_name, unmerge_and_fill_excel, validate_and_merge_data, save_to_neon
)
from scripts.sharepoint_sync.models import (
    EntidadeBase, Contrato, ControleFiscalizacao, PagamentoPrestacao, RepasseConvenio
)

# Mock para simular um arquivo Excel com células mescladas para testes
def create_mock_excel_with_merged_cells(sheet_name: str = "Sheet1") -> io.BytesIO:
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = sheet_name

    # Cabeçalhos com células mescladas
    sheet['A1'] = "HEADER_MESCLADO_1"
    sheet.merge_cells('A1:B1')
    sheet['C1'] = "HEADER_NORMAL_2"
    sheet['D1'] = "HEADER_MESCLADO_3"
    sheet.merge_cells('D1:E1')

    # Dados
    sheet['A2'] = "Valor A"
    sheet['C2'] = "Valor C"
    sheet['D2'] = "Valor D"
    sheet['A3'] = "Valor A-2"
    sheet['C3'] = "Valor C-2"

    # Salvar em um BytesIO
    excel_content = io.BytesIO()
    workbook.save(excel_content)
    excel_content.seek(0)
    return excel_content

# --- Testes para funções auxiliares de main.py ---

def test_normalize_column_name():
    assert normalize_column_name(" CNPJ ") == "cnpj"
    assert normalize_column_name("N° PROCESSO") == "n_processo"
    assert normalize_column_name("Previsão de Recurso Financeiro/Ano") == "previsao_de_recurso_financeiro_ano"
    assert normalize_column_name("Ajustes PT - Último Doc") == "ajustes_pt_ultimo_doc"
    assert normalize_column_name(123) == "123" # Números devem ser convertidos para string e normalizados

@patch('openpyxl.load_workbook')
def test_unmerge_and_fill_excel(mock_load_workbook):
    mock_workbook = MagicMock()
    mock_sheet = MagicMock()
    mock_workbook.active = mock_sheet
    mock_workbook.sheetnames = ["Sheet1"]
    mock_workbook.__getitem__.return_value = mock_sheet
    mock_load_workbook.return_value = mock_workbook

    # Simula células mescladas
    mock_sheet.merged_cells = ["A1:B1"]
    mock_sheet.cell.side_effect = [
        MagicMock(value="Merged Value"), # A1
        MagicMock(value=None),            # B1
        MagicMock(value="Normal C")      # C1
    ]

    # Crie um mock de BytesIO para o input
    mock_excel_input = io.BytesIO(b"dummy excel content")
    
    # Chama a função
    result_bytes_io = unmerge_and_fill_excel(mock_excel_input, "Sheet1")

    # Verifica se as funções do openpyxl foram chamadas corretamente
    mock_load_workbook.assert_called_once_with(mock_excel_input, data_only=False)
    mock_sheet.unmerge_cells.assert_called_once_with("A1:B1")
    
    # Verifica se o valor da célula mesclada foi propagado
    # Isso é um pouco mais complexo de testar com mocks puros para todas as células preenchidas
    # Mas podemos verificar que a função de salvar foi chamada
    mock_workbook.save.assert_called_once() 
    assert isinstance(result_bytes_io, io.BytesIO)

def test_preprocess_df():
    # DataFrame de exemplo com CNPJ, colunas a serem renomeadas e colunas extras
    df_raw = pd.DataFrame({
        'CNPJ ': ['12.345.678/0001-90', '987.654.321-0001/01', None, 'invalid'],
        'RAZÃO SOCIAL': ['Empresa A', 'Empresa B', 'Empresa C', 'Empresa D'],
        ' UF ': ['SP', 'RJ', 'MG', 'ES'],
        'VALOR TOTAL': ['R$ 1000,00', '2000', '3000,50', 'abcd']
    })

    cols_to_rename = {
        'RAZÃO SOCIAL': 'razao_social',
        'UF': 'estado' # Renomeando para 'estado' para teste
    }

    df_processed = preprocess_df(df_raw, 'CNPJ ', cols_to_rename)

    # Verifica a normalização dos nomes das colunas
    assert "cnpj" in df_processed.columns
    assert "razao_social" in df_processed.columns
    assert "estado" in df_processed.columns
    assert "valor_total" in df_processed.columns
    assert "uf" not in df_processed.columns # Garante que 'UF' foi renomeado

    # Verifica a limpeza e ffill do CNPJ
    assert df_processed.loc[0, 'cnpj'] == "12345678000190"
    assert df_processed.loc[1, 'cnpj'] == "987654321000101"
    assert len(df_processed) == 2 # Linhas com CNPJ inválido/nulo devem ser removidas

    # Verifica que 'valor_total' não foi renomeado mas normalizado e mantido (não estava no cols_to_rename)
    assert "valor_total" in df_processed.columns

# --- Testes para validate_and_merge_data (Mocks complexos) ---
@patch('scripts.sharepoint_sync.main.preprocess_df')
def test_validate_and_merge_data(mock_preprocess_df):
    # Configura os mocks para preprocess_df retornar DataFrames limpos e padronizados
    mock_df_base = pd.DataFrame({
        'cnpj': ['11111111000111', '22222222000222'],
        'comunidade_terapeutica': ['CT A', 'CT B'],
        'dt_inicial_ct': ['01/01/2023', '01/02/2023']
    })
    mock_df_fiscal = pd.DataFrame({
        'cnpj': ['11111111000111'],
        'numero_contrato': ['FIS-001'],
        'data_fiscalizacao_texto': ['15/03/2023']
    })
    mock_df_renov = pd.DataFrame({
        'cnpj': ['11111111000111', '22222222000222'],
        'razao_social': ['Empresa Teste A', 'Empresa Teste B'],
        'uf': ['SP', 'RJ']
    })
    mock_df_pagto = pd.DataFrame({
        'cnpj': ['11111111000111'],
        'valor_dezembro': ['R$ 5000,00']
    })
    mock_df_repasses = pd.DataFrame({
        'convenente': ['Empresa Teste A', 'Outra Empresa'],
        'numero_parceria': ['PARC-001', 'PARC-002'],
        'cnpj_entidade': ['11111111000111', None], # Simula um repasse sem CNPJ direto
        'valor_global': ['100.000,00', '50.000,00']
    })

    mock_preprocess_df.side_effect = [
        mock_df_base.copy(),
        mock_df_fiscal.copy(),
        mock_df_renov.copy(),
        mock_df_pagto.copy(),
        mock_df_repasses.copy(),
        # Para o merge de repasses, o preprocess_df de df_entidades_for_merge
        mock_df_renov.copy() # para df_entidades_for_merge na parte de repasses
    ]

    result = validate_and_merge_data(MagicMock(), MagicMock(), MagicMock(), MagicMock(), MagicMock())

    assert isinstance(result, dict)
    assert "entidades_base" in result
    assert "contratos" in result
    assert "controle_fiscalizacao" in result
    assert "pagamentos_prestacao" in result
    assert "repasses_convenios" in result

    # Verifica o número de modelos criados
    assert len(result["entidades_base"]) == 2
    assert len(result["contratos"]) == 2
    assert len(result["controle_fiscalizacao"]) == 1
    assert len(result["pagamentos_prestacao"]) == 1
    assert len(result["repasses_convenios"]) == 2 # 1 com CNPJ mapeado, 1 sem

    # Verifica se os objetos são do tipo Pydantic correto
    assert isinstance(result["entidades_base"][0], EntidadeBase)
    assert isinstance(result["contratos"][0], Contrato)
    assert isinstance(result["controle_fiscalizacao"][0], ControleFiscalizacao)
    assert isinstance(result["pagamentos_prestacao"][0], PagamentoPrestacao)
    assert isinstance(result["repasses_convenios"][0], RepasseConvenio)

    # Verifica a associação do CNPJ via razão social nos repasses
    assert result["repasses_convenios"][0].cnpj_entidade == "11111111000111"
    assert result["repasses_convenios"][1].cnpj_entidade is None

# --- Testes para save_to_neon ---
@patch('sqlalchemy.create_engine')
@patch('pandas.DataFrame.to_sql')
def test_save_to_neon(mock_to_sql, mock_create_engine):
    # Configura o mock do create_engine
    mock_engine = MagicMock()
    mock_connection = MagicMock()
    mock_engine.begin.return_value.__enter__.return_value = mock_connection
    mock_create_engine.return_value = mock_engine

    # Simula DATABASE_URL
    with patch.dict(os.environ, {'DATABASE_URL': 'postgresql://user:pass@host:port/db'}):
        # Cria alguns modelos Pydantic de exemplo
        models_to_save = [
            EntidadeBase(cnpj="11111111000111", razao_social="Empresa X"),
            EntidadeBase(cnpj="22222222000222", razao_social="Empresa Y")
        ]

        save_to_neon(models_to_save, "entidades_base")

        # Verifica se o create_engine foi chamado
        mock_create_engine.assert_called_once_with("postgresql://user:pass@host:port/db")
        
        # Verifica se o TRUNCATE foi executado
        mock_connection.execute.assert_called_once_with("TRUNCATE TABLE entidades_base RESTART IDENTITY CASCADE;")
        
        # Verifica se o to_sql foi chamado com os dados corretos
        assert mock_to_sql.called # Garante que foi chamado
        args, kwargs = mock_to_sql.call_args
        assert kwargs['name'] == "entidades_base"
        assert kwargs['con'] == mock_connection
        assert kwargs['if_exists'] == "append"
        assert kwargs['index'] == False
        
        # Teste para nenhum modelo a ser salvo
        mock_create_engine.reset_mock()
        mock_to_sql.reset_mock()
        mock_connection.execute.reset_mock()
        save_to_neon([], "tabela_vazia")
        mock_create_engine.assert_not_called() # Não deve chamar se não há dados
        mock_to_sql.assert_not_called()
        mock_connection.execute.assert_not_called()

    # Teste sem DATABASE_URL
    with patch.dict(os.environ, {}, clear=True):
        mock_create_engine.reset_mock()
        mock_to_sql.reset_mock()
        mock_connection.execute.reset_mock()
        models_to_save = [
            EntidadeBase(cnpj="11111111000111", razao_social="Empresa Z")
        ]
        save_to_neon(models_to_save, "tabela_sem_url")
        mock_create_engine.assert_not_called()
        mock_to_sql.assert_not_called()
        mock_connection.execute.assert_not_called()
