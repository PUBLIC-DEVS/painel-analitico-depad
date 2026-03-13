import pytest
import pandas as pd
from datetime import date
from pydantic import ValidationError

from scripts.sharepoint_sync.models import (
    clean_numeric, clean_date, clean_cnpj,
    EntidadeBase, Contrato, ControleFiscalizacao, PagamentoPrestacao, RepasseConvenio
)

# --- Testes para as funções de limpeza auxiliares ---

def test_clean_numeric():
    assert clean_numeric("R$ 1.234,56") == 1234.56
    assert clean_numeric("1.000") == 1000.0
    assert clean_numeric("500,00") == 500.0
    assert clean_numeric(123) == 123
    assert clean_numeric(123.45) == 123.45
    assert clean_numeric("abc") is None # Deve retornar None para valores não numéricos
    assert clean_numeric(None) is None
    assert clean_numeric(pd.NA) is None

def test_clean_date():
    assert clean_date("01/01/2023") == date(2023, 1, 1)
    assert clean_date("2023-01-01") == date(2023, 1, 1)
    assert clean_date("01-01-2023") == date(2023, 1, 1) # Teste adicional
    assert clean_date(44927) == date(2023, 1, 1) # Excel date serial for 2023-01-01
    assert clean_date(date(2023, 1, 1)) == date(2023, 1, 1)
    assert clean_date("invalid-date") is None
    assert clean_date(None) is None
    assert clean_date(pd.NA) is None

def test_clean_cnpj():
    assert clean_cnpj("12.345.678/0001-90") == "12345678000190"
    assert clean_cnpj("12345678000190") == "12345678000190"
    assert clean_cnpj(12345678000190) == "12345678000190"
    assert clean_cnpj(1.234567800019e+13) == "12345678000190" # Teste com float notação científica
    assert clean_cnpj("123") is None # CNPJ muito curto
    assert clean_cnpj("invalid_cnpj") is None
    assert clean_cnpj(None) is None
    assert clean_cnpj(pd.NA) is None

# --- Testes para os Modelos Pydantic ---

def test_entidade_base_model():
    data = {
        "cnpj": "11111111000111",
        "razao_social": "Empresa Teste LTDA",
        "uf": "SP",
        "municipio": "Sao Paulo",
        "telefone": "11987654321",
        "email": "contato@empresa.com",
        "endereco": "Rua Exemplo, 123",
        "cep": "01000-000"
    }
    entidade = EntidadeBase(**data)
    for key, value in data.items():
        assert getattr(entidade, key) == value

    # Teste de validação para CNPJ inválido
    with pytest.raises(ValidationError):
        EntidadeBase(cnpj="123", razao_social="Invalida")
    
    # Teste com campos opcionais faltando
    data_min = {
        "cnpj": "22222222000222",
        "razao_social": "Empresa Minima"
    }
    entidade_min = EntidadeBase(**data_min)
    assert entidade_min.cnpj == "22222222000222"
    assert entidade_min.razao_social == "Empresa Minima"
    assert entidade_min.uf is None

def test_contrato_model():
    data = {
        "cnpj_entidade": "11111111000111",
        "comunidade_terapeutica": "CT A",
        "contrato_ano": "2023",
        "numero_contrato": "CT-001/2023",
        "ano_contrato": 2023,
        "processo_mae": "PRO_001",
        "dt_inicial_ct": "01/01/2023",
        "dt_inicial_ta1": "01/02/2023",
        "dt_inicial_ta2": None,
        "vagas_contratadas": 10,
        "previsao_recurso_mensal": "R$ 10.000,50",
        "previsao_recurso_anual": 120000.00
    }
    contrato = Contrato(**data)
    assert contrato.cnpj_entidade == "11111111000111"
    assert contrato.dt_inicial_ct == date(2023, 1, 1)
    assert contrato.previsao_recurso_mensal == 10000.50

    with pytest.raises(ValidationError):
        Contrato(cnpj_entidade="inv", numero_contrato="c1") # CNPJ inválido

def test_controle_fiscalizacao_model():
    data = {
        "cnpj_entidade": "11111111000111",
        "numero_contrato": "FIS-001",
        "data_fiscalizacao_texto": "15/03/2023",
        "uf": "MG",
        "previsao_recurso_ano": "100.000,00"
    }
    fiscalizacao = ControleFiscalizacao(**data)
    assert fiscalizacao.cnpj_entidade == "11111111000111"
    assert fiscalizacao.data_fiscalizacao_texto == "15/03/2023"
    assert fiscalizacao.previsao_recurso_ano == 100000.00

    with pytest.raises(ValidationError):
        ControleFiscalizacao(cnpj_entidade="123", numero_contrato="FIS-002")

def test_pagamento_prestacao_model():
    data = {
        "cnpj_entidade": "11111111000111",
        "numero_contrato": "PAG-001",
        "ano": 2023,
        "valor_dezembro": "R$ 5.000,00"
    }
    pagamento = PagamentoPrestacao(**data)
    assert pagamento.cnpj_entidade == "11111111000111"
    assert pagamento.valor_dezembro == 5000.00

    with pytest.raises(ValidationError):
        PagamentoPrestacao(cnpj_entidade="123", ano=2023)

def test_repasse_convenio_model():
    data = {
        "cnpj_entidade": "11111111000111",
        "convenente_nome_original": "Associacao Beneficente X",
        "numero_parceria": "PARC-001",
        "vigencia_inicio": "10/01/2023",
        "valor_global": "250.000,00",
        "data_assinatura": "05/01/2023"
    }
    repasse = RepasseConvenio(**data)
    assert repasse.cnpj_entidade == "11111111000111"
    assert repasse.vigencia_inicio == date(2023, 1, 10)
    assert repasse.valor_global == 250000.00

    # CNPJ pode ser None neste modelo, então não deve levantar erro aqui
    data_no_cnpj = {
        "convenente_nome_original": "Associacao Sem CNPJ",
        "numero_parceria": "PARC-002",
        "vigencia_inicio": "10/01/2023",
        "valor_global": "100.000,00",
        "data_assinatura": "05/01/2023"
    }
    repasse_no_cnpj = RepasseConvenio(**data_no_cnpj)
    assert repasse_no_cnpj.cnpj_entidade is None
