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
    text: 'O gestor vê a fazenda inteira num painel: custos, resultado e relatórios, sem montar planilha.',
    chips: ['Visão geral', 'Custos', 'Financeiro e ativos', 'Dashboards'],
    where: 'No escritório: Cerne Web. Para o gestor: app de Administração (em construção).',
  },
  confinamento: {
    name: 'Confinamento',
    title: 'Pecuária e confinamento',
    text: 'Rebanho, lotes, currais, dieta, trato diário e leitura de cocho.',
    chips: ['Lotação de currais', 'Trato diário', 'Leitura de cocho', 'Custos do confinamento'],
    where: 'O trato e a leitura de cocho são apontados no campo pelo app de Operação (em construção).',
  },
  estoque: {
    name: 'Estoque',
    title: 'Suprimentos e estoque',
    text: 'Cotação, compra, recebimento e fábrica de ração.',
    chips: ['Cotação', 'Compra', 'Recebimento', 'Fábrica de ração'],
    where: 'A ração que sai para o trato baixa do estoque no mesmo cadastro.',
  },
  lavoura: {
    name: 'Plantação',
    title: 'Agricultura',
    text: 'Planejamento de safra, talhões, romaneios e rastreabilidade.',
    chips: ['Planejamento de safra', 'Talhões', 'Romaneios', 'Rastreabilidade'],
    where: 'Os apontamentos de plantio saem do campo pelo app de Operação (em construção).',
  },
}

export const ZONE_ORDER: Zone[] = ['sede', 'confinamento', 'estoque', 'lavoura']
