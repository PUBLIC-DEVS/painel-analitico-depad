import logging
from pydantic import BaseModel, Field, ValidationError, validator
from datetime import date
from typing import Optional, List, Dict, Any
import re
import pandas as pd

# Configura o logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Funções de Limpeza ---
def clean_numeric(value):
    if pd.isna(value): return None
    if isinstance(value, (int, float)): return value
    if isinstance(value, str):
        cleaned = re.sub(r'[R$\s\.]', '', value).replace(',', '.')
        try: return float(cleaned)
        except ValueError: return None
    return None

def clean_date(value):
    if pd.isna(value): return None
    if isinstance(value, date): return value
    if isinstance(value, str):
        try:
            for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%m/%d/%Y'):
                try: return pd.to_datetime(value, format=fmt, dayfirst=True).date()
                except ValueError: pass
            return pd.to_datetime(value, dayfirst=True).date()
        except Exception: return None
    if isinstance(value, (int, float)):
        try: return pd.to_datetime(value, unit='D', origin='1899-12-30').date()
        except Exception: return None
    return None

def clean_to_str(value):
    if pd.isna(value): return None
    if isinstance(value, (int, float)): return str(int(value))
    return str(value)

def clean_cnpj(value):
    if pd.isna(value): return None
    if isinstance(value, (int, float)): value = str(int(value)).zfill(14)
    if isinstance(value, str):
        cleaned = re.sub(r'\D', '', value)
        return cleaned.zfill(14) if len(cleaned) <= 14 else cleaned
    return None

# --- Models para Mirror Mapping (1 Tabela por Planilha) ---

class CleanableModel(BaseModel):
    @classmethod
    def clean_record(cls, record: Dict[str, Any]) -> Dict[str, Any]:
        """Limpa as colunas conhecidas do record e mantém as desconhecidas intactas."""
        fields = cls.model_fields.keys()
        # Filtra apenas o que o modelo conhece para validar
        known_data = {k: v for k, v in record.items() if k in fields}
        try:
            # Valida e limpa usando Pydantic
            cleaned = cls(**known_data).model_dump()
            # Remove additional_data do cleaned se existir (não queremos aninhado aqui)
            cleaned.pop('additional_data', None)
            # Retorna o record original atualizado com os valores limpos
            return {**record, **cleaned}
        except Exception:
            # Se falhar a validação de um campo crítico, retorna o record como está 
            # (O main.py decide se pula ou não)
            return record

class RawBaseVigente(CleanableModel):
    contrato_ano: Optional[str] = None
    comunidade_terapeutica_razao_social: Optional[str] = None
    nome_fantasia: Optional[str] = None
    cnpj: Optional[str] = None
    processo_mae: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    vagas_contratadas: Optional[int] = None
    additional_data: Dict[str, Any] = Field(default_factory=dict)
    
    _clean_cnpj = validator('cnpj', allow_reuse=True, pre=True)(clean_cnpj)
    _clean_str = validator('contrato_ano', 'comunidade_terapeutica_razao_social', 'nome_fantasia', 'processo_mae', 'cidade', 'uf', allow_reuse=True, pre=True)(clean_to_str)
    _clean_num = validator('vagas_contratadas', allow_reuse=True, pre=True)(clean_numeric)

class RawFiscalizacao(CleanableModel):
    contrato: Optional[str] = None
    nome_da_instituicao: Optional[str] = None
    cnpj: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None
    localidade: Optional[str] = None
    uf: Optional[str] = None
    cep: Optional[str] = None
    processo_mae: Optional[str] = None
    processo_pagamento: Optional[str] = None
    vagas_contratadas: Optional[int] = None
    adulto_masculino: Optional[int] = None
    adulto_feminino: Optional[int] = None
    maes: Optional[int] = None
    additional_data: Dict[str, Any] = Field(default_factory=dict)

    _clean_cnpj = validator('cnpj', allow_reuse=True, pre=True)(clean_cnpj)
    _clean_str = validator('contrato', 'nome_da_instituicao', 'telefone', 'email', 'endereco', 'localidade', 'uf', 'cep', 'processo_mae', 'processo_pagamento', allow_reuse=True, pre=True)(clean_to_str)
    _clean_num = validator('vagas_contratadas', 'adulto_masculino', 'adulto_feminino', 'maes', allow_reuse=True, pre=True)(clean_numeric)

class RawRenovacao(CleanableModel):
    contrato: Optional[str] = None
    entidades: Optional[str] = None
    cnpj: Optional[str] = None
    n_processo: Optional[str] = None
    telefone: Optional[str] = None
    e_mail: Optional[str] = None
    endereco: Optional[str] = None
    cep: Optional[str] = None
    localidade: Optional[str] = None
    uf: Optional[str] = None
    vagas_contratadas: Optional[int] = None
    vagas_adulto_masculino: Optional[int] = None
    vagas_adulto_feminino: Optional[int] = None
    vagas_maes: Optional[int] = None
    previsao_recurso_anual: Optional[float] = None
    previsao_recurso_mensal: Optional[float] = None
    valor_marco_dezembro: Optional[float] = None
    additional_data: Dict[str, Any] = Field(default_factory=dict)

    _clean_cnpj = validator('cnpj', allow_reuse=True, pre=True)(clean_cnpj)
    _clean_str = validator('contrato', 'entidades', 'n_processo', 'telefone', 'e_mail', 'endereco', 'cep', 'localidade', 'uf', allow_reuse=True, pre=True)(clean_to_str)
    _clean_num = validator('previsao_recurso_anual', 'previsao_recurso_mensal', 'valor_marco_dezembro', allow_reuse=True, pre=True)(clean_numeric)

class RawPagamento(CleanableModel):
    n: Optional[int] = None
    comunidade_terapeutica: Optional[str] = None
    contrato_ano: Optional[str] = None
    unnamed_3: Optional[str] = None
    ano: Optional[int] = None
    cnpj: Optional[str] = None
    processo_mae: Optional[str] = None
    processo_pagamento: Optional[str] = None
    pagamento_dez_status: Optional[str] = None
    formulario_pagamento: Optional[str] = None
    data_envio_sgt: Optional[str] = None
    valor_dezembro: Optional[float] = None
    additional_data: Dict[str, Any] = Field(default_factory=dict)

    _clean_cnpj = validator('cnpj', allow_reuse=True, pre=True)(clean_cnpj)
    _clean_str = validator('comunidade_terapeutica', 'contrato_ano', 'unnamed_3', 'processo_mae', 'processo_pagamento', 'pagamento_dez_status', 'formulario_pagamento', 'data_envio_sgt', allow_reuse=True, pre=True)(clean_to_str)
    _clean_num = validator('n', 'ano', 'valor_dezembro', allow_reuse=True, pre=True)(clean_numeric)

class RawRepasse(CleanableModel):
    convenente: Optional[str] = None
    cnpj: Optional[str] = None
    uf: Optional[str] = None
    municipio: Optional[str] = None
    instrumento: Optional[str] = None
    objeto: Optional[str] = None
    n_processo: Optional[str] = None
    additional_data: Dict[str, Any] = Field(default_factory=dict)

    _clean_cnpj = validator('cnpj', allow_reuse=True, pre=True)(clean_cnpj)
    _clean_str = validator('convenente', 'uf', 'municipio', 'instrumento', 'objeto', 'n_processo', allow_reuse=True, pre=True)(clean_to_str)