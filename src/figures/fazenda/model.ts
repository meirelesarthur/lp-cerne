// Setores da maquete e o que o Cerne faz em cada um (mesma copy da seção Sistema, doc 08).
export type Zone = 'sede' | 'confinamento' | 'estoque' | 'lavoura'

export interface ZoneInfo {
  name: string
  title: string
  text: string
  chips: string[]
  /** onde a informação nasce e onde é vista */
  where: string
}

export const OVERVIEW = {
  title: 'A fazenda inteira num painel só',
  text: 'Cada operação feita no campo vira um registro no Cerne, e o escritório acompanha tudo no mesmo lugar. Escolha um ponto para ver o que o sistema faz ali.',
}

export const ZONES: Record<Zone, ZoneInfo> = {
  sede: {
    name: 'Sede',
    title: 'Escritório e gestão',
    text: 'O gestor vê a fazenda inteira num painel: custo COE × COT, margem, DRE e 115 relatórios, sem montar planilha.',
    chips: ['Visão geral', 'Custos', 'Financeiro e fiscal', 'Dashboards'],
    where: 'No escritório: Cerne Web. Para o gestor: app de Administração (em construção).',
  },
  confinamento: {
    name: 'Confinamento',
    title: 'Pecuária e confinamento',
    text: 'Rebanho, lotes, currais, dietas e batidas, pesagem, sanitário e reprodução.',
    chips: ['Mapa de confinamento', 'Dietas e batidas', 'Pesagem e GMD', 'Custos do confinamento'],
    where: 'No campo, o trato e a leitura de cocho serão apontados pelo app de Operação (em teste).',
  },
  estoque: {
    name: 'Estoque',
    title: 'Suprimentos e estoque',
    text: 'Cotação, aprovação, compra, recebimento e fábrica de ração.',
    chips: ['Cotação via link', 'Aprovação', 'Recebimento', 'Fábrica de ração'],
    where: 'A ração que sai para o trato baixa do estoque no mesmo cadastro.',
  },
  lavoura: {
    name: 'Plantação',
    title: 'Agricultura',
    text: 'Planejamento de safra, talhões no mapa, romaneios com balança integrada e rastreabilidade aberta ao comprador.',
    chips: ['Planejamento de safra', 'Talhões', 'Romaneios', 'Rastreio público'],
    where: 'Os apontamentos de plantio saem do campo pelo app de Operação (em construção).',
  },
}

export const ZONE_ORDER: Zone[] = ['sede', 'confinamento', 'estoque', 'lavoura']
