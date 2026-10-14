// Setores da maquete e o que o Cerne faz em cada um (mesma copy da seção Sistema, doc 08).
export type Zone = 'sede' | 'confinamento' | 'estoque' | 'lavoura'

export interface ZoneInfo {
  tab: string
  title: string
  text: string
  chips: string[]
  /** onde a informação nasce e onde é vista */
  where: string
  img?: string
}

export const OVERVIEW: ZoneInfo = {
  tab: 'Visão geral',
  title: 'A fazenda inteira num painel só',
  text: 'Cada operação feita no campo vira um registro no Cerne, e o escritório acompanha tudo no mesmo lugar: trato, estoque, lavoura e custo.',
  chips: ['Confinamento', 'Estoque', 'Lavoura', 'Financeiro'],
  where: 'Toque num setor da maquete para ver o módulo.',
  img: 'visao-geral',
}

export const ZONES: Record<Zone, ZoneInfo> = {
  sede: {
    tab: 'Sede',
    title: 'Escritório e gestão',
    text: 'Visão geral, custos, resultado e relatórios num painel, sem montar planilha.',
    chips: ['Visão geral', 'Custos', 'Financeiro e ativos', 'Dashboards'],
    where: 'No escritório: Cerne Web. Para o gestor: app de Administração (em construção).',
    img: 'financeiros',
  },
  confinamento: {
    tab: 'Confinamento',
    title: 'Pecuária e confinamento',
    text: 'Rebanho, lotes, currais, dieta, trato diário e leitura de cocho.',
    chips: ['Lotação de currais', 'Trato diário', 'Leitura de cocho', 'Custos do confinamento'],
    where: 'O trato e a leitura de cocho são apontados no campo pelo app de Operação (em construção).',
    img: 'lotacao-currais',
  },
  estoque: {
    tab: 'Estoque',
    title: 'Suprimentos e estoque',
    text: 'Cotação, compra, recebimento e fábrica de ração.',
    chips: ['Cotação', 'Compra', 'Recebimento', 'Fábrica de ração'],
    where: 'A ração que sai para o trato baixa do estoque no mesmo cadastro.',
    img: 'suprimentos',
  },
  lavoura: {
    tab: 'Lavoura',
    title: 'Agricultura',
    text: 'Planejamento de safra, talhões, romaneios e rastreabilidade.',
    chips: ['Planejamento de safra', 'Talhões', 'Romaneios', 'Rastreabilidade'],
    where: 'Os apontamentos de plantio saem do campo pelo app de Operação (em construção).',
  },
}

export const ZONE_ORDER: Zone[] = ['sede', 'confinamento', 'estoque', 'lavoura']
