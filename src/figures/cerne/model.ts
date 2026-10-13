// Modelo da figura "Eixo do Cerne": o ciclo da ordem de serviço (o mesmo da seção Perfis).
// A geometria (tools/iso/cerne/build.mjs) usa a mesma ordem de donos em STEP_OWNERS.

export type Device = 'web' | 'adm' | 'op'

export const DEVICES: Record<Device, { name: string; who: string; tag: string }> = {
  web: { name: 'Cerne Web', who: 'escritório', tag: 'Disponível' },
  adm: { name: 'Cerne Administração', who: 'gestor', tag: 'Em construção' },
  op: { name: 'Cerne Operação', who: 'campo', tag: 'Em construção' },
}

export const STEPS: { by: Device; action: string; status: string; short: string }[] = [
  { by: 'web', action: 'Criar a OS', status: 'OS criada', short: 'criada' },
  { by: 'op', action: 'Receber no campo', status: 'No campo', short: 'no campo' },
  { by: 'op', action: 'Apontar em etapas', status: 'Apontada', short: 'apontada' },
  { by: 'adm', action: 'Avaliar o resultado', status: 'Avaliada', short: 'avaliada' },
]

export const IDLE_STATUS = 'Sem OS'

/** Estado da OS: `step` é o último passo concluído (−1 = nenhuma OS aberta ainda). */
export interface OsState {
  os: number
  step: number
}

export const nextStep = (s: OsState) => (s.step + 1) % STEPS.length

export function advance(s: OsState): OsState {
  const next = nextStep(s)
  return { os: next === 0 ? s.os + 1 : s.os, step: next }
}

export const statusOf = (s: OsState) => (s.step < 0 ? IDLE_STATUS : STEPS[s.step].status)

export function readoutOf(s: OsState) {
  const turn = DEVICES[STEPS[nextStep(s)].by].who
  if (s.step < 0) return `nenhuma OS · vez do ${turn}`
  return `OS ${String(s.os).padStart(3, '0')} · ${STEPS[s.step].short} · vez do ${turn}`
}
