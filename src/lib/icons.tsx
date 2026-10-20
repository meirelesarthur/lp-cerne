import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'

export {
  Analytics01Icon, ArrowDown01Icon, ArrowRight01Icon, BarnsIcon, Building02Icon, Calculator01Icon, Chart01Icon, Chat01Icon, HistoryIcon, Invoice01Icon, Mouse01Icon,
  PauseIcon, PlayIcon, PlusIcon, QrCodeIcon, SecurityLockIcon, ShoppingCart01Icon, SmartPhone01Icon, Tick02Icon, TractorIcon, WarehouseIcon, WeightScale01Icon, WhatsappIcon,
} from '@hugeicons/core-free-icons'

/** Ícone da LP: sempre Hugeicons (stroke rounded), decorativo por padrão e herdando a cor do texto. */
export function Icon({ icon, size = 24, strokeWidth = 1.6, className }: { icon: IconSvgElement; size?: number; strokeWidth?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />
}
