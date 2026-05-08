export interface Comunidade {
  contrato_ano:       string;
  razao_social:       string;
  nome_fantasia:      string;
  cnpj:               string;
  processo_mae:       string;
  cidade:             string;
  uf:                 string;
  contrato:           string;
  ano:                number;
  endereco:           string;
  telefone:           string;
  email:              string;
  vagas_contratadas:  number;
  adulto_masc:        number;
  adulto_feminino:    number;
  maes:               number;
  recurso_anual:      string;
  recurso_mensal:     string;
  status_ct:          string;
  data_inicial_ct:    string;
  data_vencimento_ct: string;
  diminuicao_vagas:   string;
  sei_assinatura:     string;
  assinado:           string;
  latitude:           string;
  longitude:          string;
}

export interface MapPoint {
  id:                string;
  contrato_ano:      string;
  nome:              string;
  nome_fantasia:     string;
  cnpj:              string;
  cidade:            string;
  uf:                string;
  lat:               number;
  lng:               number;
  vagas_contratadas: number;
  adulto_masc:       number;
  adulto_feminino:   number;
  maes:              number;
  recurso_mensal:    string;
  status_ct:         string;
}

export interface MonthEntry {
  mes:      string;
  pago:     number;
  previsto: number;
}

export interface OrcamentoEntry {
  anual:      number;
  mensal:     number;
  mediaUso:   number;
  avgPct:     number;
  mensal_pct: number;
  anual_pct:  number;
}

export interface PagamentosData {
  monthly:   Record<string, MonthEntry[]>;
  orcamento: Record<string, OrcamentoEntry>;
}