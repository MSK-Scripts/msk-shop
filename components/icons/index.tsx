/**
 * The one place icons come from: Phosphor, regular weight, through its SSR
 * build so the same import works in server and client components.
 *
 * Every icon is decorative by default (aria-hidden, not focusable), as the
 * lucide icons were before. Give one an aria-label or aria-labelledby and it
 * is announced instead.
 *
 * Only the icons listed here end up in the bundle. A new one is added to the
 * import and the export list below.
 */
import { forwardRef } from 'react'
import type { Icon, IconProps } from '@phosphor-icons/react'
import {
  Archive as ArchiveBase,
  ArrowCounterClockwise as ArrowCounterClockwiseBase,
  ArrowLeft as ArrowLeftBase,
  ArrowRight as ArrowRightBase,
  ArrowSquareOut as ArrowSquareOutBase,
  ArrowUpRight as ArrowUpRightBase,
  ArrowsClockwise as ArrowsClockwiseBase,
  ArrowsCounterClockwise as ArrowsCounterClockwiseBase,
  ArrowsOut as ArrowsOutBase,
  Bell as BellBase,
  BookOpen as BookOpenBase,
  CalendarBlank as CalendarBlankBase,
  Car as CarBase,
  CaretDown as CaretDownBase,
  CaretLeft as CaretLeftBase,
  CaretRight as CaretRightBase,
  ChartBar as ChartBarBase,
  ChatCircle as ChatCircleBase,
  ChatText as ChatTextBase,
  Check as CheckBase,
  CheckCircle as CheckCircleBase,
  CircleNotch as CircleNotchBase,
  ClipboardText as ClipboardTextBase,
  Clock as ClockBase,
  Copy as CopyBase,
  Copyright as CopyrightBase,
  CreditCard as CreditCardBase,
  Crosshair as CrosshairBase,
  Cube as CubeBase,
  Database as DatabaseBase,
  DiceFive as DiceFiveBase,
  DownloadSimple as DownloadSimpleBase,
  Envelope as EnvelopeBase,
  Eye as EyeBase,
  EyeClosed as EyeClosedBase,
  EyeSlash as EyeSlashBase,
  FileText as FileTextBase,
  Files as FilesBase,
  Flag as FlagBase,
  Flame as FlameBase,
  FloppyDisk as FloppyDiskBase,
  GearSix as GearSixBase,
  Gift as GiftBase,
  Globe as GlobeBase,
  HandHeart as HandHeartBase,
  HardDrive as HardDriveBase,
  HardDrives as HardDrivesBase,
  Hash as HashBase,
  ImageSquare as ImageSquareBase,
  Info as InfoBase,
  Key as KeyBase,
  Layout as LayoutBase,
  Lightning as LightningBase,
  List as ListBase,
  ListChecks as ListChecksBase,
  Lock as LockBase,
  MagnifyingGlass as MagnifyingGlassBase,
  MagnifyingGlassPlus as MagnifyingGlassPlusBase,
  Megaphone as MegaphoneBase,
  Minus as MinusBase,
  Monitor as MonitorBase,
  Moon as MoonBase,
  Package as PackageBase,
  Palette as PaletteBase,
  Paperclip as PaperclipBase,
  Pause as PauseBase,
  PauseCircle as PauseCircleBase,
  PencilSimple as PencilSimpleBase,
  Play as PlayBase,
  Plus as PlusBase,
  Prohibit as ProhibitBase,
  Pulse as PulseBase,
  Receipt as ReceiptBase,
  Rocket as RocketBase,
  Scales as ScalesBase,
  Scroll as ScrollBase,
  Shield as ShieldBase,
  ShieldCheck as ShieldCheckBase,
  ShieldWarning as ShieldWarningBase,
  ShoppingBag as ShoppingBagBase,
  ShoppingCart as ShoppingCartBase,
  SignIn as SignInBase,
  SignOut as SignOutBase,
  SlidersHorizontal as SlidersHorizontalBase,
  Sparkle as SparkleBase,
  SquaresFour as SquaresFourBase,
  Stack as StackBase,
  Star as StarBase,
  Stop as StopBase,
  Storefront as StorefrontBase,
  Sun as SunBase,
  Tag as TagBase,
  TerminalWindow as TerminalWindowBase,
  ThumbsDown as ThumbsDownBase,
  ThumbsUp as ThumbsUpBase,
  Ticket as TicketBase,
  Translate as TranslateBase,
  Trash as TrashBase,
  TrendDown as TrendDownBase,
  TrendUp as TrendUpBase,
  Trophy as TrophyBase,
  UploadSimple as UploadSimpleBase,
  User as UserBase,
  UserCheck as UserCheckBase,
  UserPlus as UserPlusBase,
  Users as UsersBase,
  Wallet as WalletBase,
  Warning as WarningBase,
  WarningCircle as WarningCircleBase,
  Wrench as WrenchBase,
  X as XBase,
  XCircle as XCircleBase,
} from '@phosphor-icons/react/ssr'

export type IconComponent = Icon

function decorative(Base: Icon): Icon {
  const Decorative = forwardRef<SVGSVGElement, IconProps>(function Decorative(props, ref) {
    const labelled = props['aria-label'] != null || props['aria-labelledby'] != null
    return <Base ref={ref} aria-hidden={labelled ? undefined : true} focusable="false" {...props} />
  })
  Decorative.displayName = Base.displayName
  return Decorative
}

export const Archive = decorative(ArchiveBase)
export const ArrowCounterClockwise = decorative(ArrowCounterClockwiseBase)
export const ArrowLeft = decorative(ArrowLeftBase)
export const ArrowRight = decorative(ArrowRightBase)
export const ArrowSquareOut = decorative(ArrowSquareOutBase)
export const ArrowUpRight = decorative(ArrowUpRightBase)
export const ArrowsClockwise = decorative(ArrowsClockwiseBase)
export const ArrowsCounterClockwise = decorative(ArrowsCounterClockwiseBase)
export const ArrowsOut = decorative(ArrowsOutBase)
export const Bell = decorative(BellBase)
export const BookOpen = decorative(BookOpenBase)
export const CalendarBlank = decorative(CalendarBlankBase)
export const Car = decorative(CarBase)
export const CaretDown = decorative(CaretDownBase)
export const CaretLeft = decorative(CaretLeftBase)
export const CaretRight = decorative(CaretRightBase)
export const ChartBar = decorative(ChartBarBase)
export const ChatCircle = decorative(ChatCircleBase)
export const ChatText = decorative(ChatTextBase)
export const Check = decorative(CheckBase)
export const CheckCircle = decorative(CheckCircleBase)
export const CircleNotch = decorative(CircleNotchBase)
export const ClipboardText = decorative(ClipboardTextBase)
export const Clock = decorative(ClockBase)
export const Copy = decorative(CopyBase)
export const Copyright = decorative(CopyrightBase)
export const CreditCard = decorative(CreditCardBase)
export const Crosshair = decorative(CrosshairBase)
export const Cube = decorative(CubeBase)
export const Database = decorative(DatabaseBase)
export const DiceFive = decorative(DiceFiveBase)
export const DownloadSimple = decorative(DownloadSimpleBase)
export const Envelope = decorative(EnvelopeBase)
export const Eye = decorative(EyeBase)
export const EyeClosed = decorative(EyeClosedBase)
export const EyeSlash = decorative(EyeSlashBase)
export const FileText = decorative(FileTextBase)
export const Files = decorative(FilesBase)
export const Flag = decorative(FlagBase)
export const Flame = decorative(FlameBase)
export const FloppyDisk = decorative(FloppyDiskBase)
export const GearSix = decorative(GearSixBase)
export const Gift = decorative(GiftBase)
export const Globe = decorative(GlobeBase)
export const HandHeart = decorative(HandHeartBase)
export const HardDrive = decorative(HardDriveBase)
export const HardDrives = decorative(HardDrivesBase)
export const Hash = decorative(HashBase)
export const ImageSquare = decorative(ImageSquareBase)
export const Info = decorative(InfoBase)
export const Key = decorative(KeyBase)
export const Layout = decorative(LayoutBase)
export const Lightning = decorative(LightningBase)
export const List = decorative(ListBase)
export const ListChecks = decorative(ListChecksBase)
export const Lock = decorative(LockBase)
export const MagnifyingGlass = decorative(MagnifyingGlassBase)
export const MagnifyingGlassPlus = decorative(MagnifyingGlassPlusBase)
export const Megaphone = decorative(MegaphoneBase)
export const Minus = decorative(MinusBase)
export const Monitor = decorative(MonitorBase)
export const Moon = decorative(MoonBase)
export const Package = decorative(PackageBase)
export const Palette = decorative(PaletteBase)
export const Paperclip = decorative(PaperclipBase)
export const Pause = decorative(PauseBase)
export const PauseCircle = decorative(PauseCircleBase)
export const PencilSimple = decorative(PencilSimpleBase)
export const Play = decorative(PlayBase)
export const Plus = decorative(PlusBase)
export const Prohibit = decorative(ProhibitBase)
export const Pulse = decorative(PulseBase)
export const Receipt = decorative(ReceiptBase)
export const Rocket = decorative(RocketBase)
export const Scales = decorative(ScalesBase)
export const Scroll = decorative(ScrollBase)
export const Shield = decorative(ShieldBase)
export const ShieldCheck = decorative(ShieldCheckBase)
export const ShieldWarning = decorative(ShieldWarningBase)
export const ShoppingBag = decorative(ShoppingBagBase)
export const ShoppingCart = decorative(ShoppingCartBase)
export const SignIn = decorative(SignInBase)
export const SignOut = decorative(SignOutBase)
export const SlidersHorizontal = decorative(SlidersHorizontalBase)
export const Sparkle = decorative(SparkleBase)
export const SquaresFour = decorative(SquaresFourBase)
export const Stack = decorative(StackBase)
export const Star = decorative(StarBase)
export const Stop = decorative(StopBase)
export const Storefront = decorative(StorefrontBase)
export const Sun = decorative(SunBase)
export const Tag = decorative(TagBase)
export const TerminalWindow = decorative(TerminalWindowBase)
export const ThumbsDown = decorative(ThumbsDownBase)
export const ThumbsUp = decorative(ThumbsUpBase)
export const Ticket = decorative(TicketBase)
export const Translate = decorative(TranslateBase)
export const Trash = decorative(TrashBase)
export const TrendDown = decorative(TrendDownBase)
export const TrendUp = decorative(TrendUpBase)
export const Trophy = decorative(TrophyBase)
export const UploadSimple = decorative(UploadSimpleBase)
export const User = decorative(UserBase)
export const UserCheck = decorative(UserCheckBase)
export const UserPlus = decorative(UserPlusBase)
export const Users = decorative(UsersBase)
export const Wallet = decorative(WalletBase)
export const Warning = decorative(WarningBase)
export const WarningCircle = decorative(WarningCircleBase)
export const Wrench = decorative(WrenchBase)
export const X = decorative(XBase)
export const XCircle = decorative(XCircleBase)
