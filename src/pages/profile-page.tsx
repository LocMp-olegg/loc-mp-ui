import {
  BadgeCheck,
  Calendar,
  Mail,
  AtSign,
  User,
  ChevronLeft,
  ShoppingBag,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useProfile } from '@/hooks/use-profile'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { ProfileInfoForm } from '@/components/profile/profile-info-form'
import { BecomeSellerCard } from '@/components/profile/become-seller-card'
import { SellerStatusCard } from '@/components/profile/seller-status-card'
import { ProfileSecuritySection } from '@/components/profile/profile-security-section'
import { AddressSection } from '@/components/profile/address-section'

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-4 animate-pulse">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
        <div className="w-24 h-24 rounded-2xl bg-muted shrink-0 self-center sm:self-auto" />
        <div className="flex-1 flex flex-col gap-2.5 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-36 bg-muted rounded-xl" />
            <div className="h-5 w-20 bg-muted rounded-full" />
          </div>
          <div className="h-4 w-28 bg-muted rounded-full" />
          <div className="h-4 w-40 bg-muted rounded-full" />
          <div className="h-3 w-32 bg-muted rounded-full mt-1" />
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="h-4 w-32 bg-muted rounded-full mb-5" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="h-10 bg-muted rounded-xl" />
          <div className="h-10 bg-muted rounded-xl" />
        </div>
        <div className="h-10 bg-muted rounded-xl mb-3" />
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="h-10 bg-muted rounded-xl" />
          <div className="h-10 bg-muted rounded-xl" />
        </div>
        <div className="h-10 w-28 bg-muted rounded-xl" />
      </div>
    </div>
  )
}

const EXTRA_ROLE_COLORS: Record<string, string> = {
  Courier: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Admin: 'bg-destructive/10 text-destructive border-destructive/20',
}
const EXTRA_ROLE_LABELS: Record<string, string> = {
  Courier: 'Курьер',
  Admin: 'Администратор',
}

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const { profile, photoUrl, loading, error, updateProfile, uploadPhoto, deletePhoto, logoutAll } =
    useProfile()

  if (loading) return <ProfileSkeleton />

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">{error ?? 'Профиль не найден'}</p>
      </div>
    )
  }

  const roles = profile.roles ?? []
  const isSeller = roles.includes('Seller')
  const extraRoles = roles.filter((r) => r !== 'User' && r !== 'Seller')

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    profile.userName ||
    user?.username ||
    'Пользователь'

  const registeredDate = new Date(profile.registeredAt).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-4">
      {/* ── Mobile back header ── */}
      <div className="flex items-center gap-2 md:hidden">
        <Link
          to={-1 as unknown as string}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base font-semibold text-foreground">Профиль</h1>
      </div>

      {/* ── Header ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6">
        <ProfileAvatar
          profile={profile}
          photoUrl={photoUrl}
          onUpload={uploadPhoto}
          onDelete={deletePhoto}
        />

        <div className="flex-1 min-w-0 flex flex-col gap-1.5 sm:justify-center">
          {/* Name + seller badge inline */}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground leading-tight">{displayName}</h1>
            {isSeller && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/12 text-primary border border-primary/25 shrink-0">
                <BadgeCheck className="w-3 h-3" />
                Продавец
              </span>
            )}
            {extraRoles.map((r) => (
              <span
                key={r}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${EXTRA_ROLE_COLORS[r] ?? 'bg-muted text-muted-foreground border-border'}`}
              >
                {EXTRA_ROLE_LABELS[r] ?? r}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <AtSign className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{profile.userName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{profile.email}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>С нами с {registeredDate}</span>
          </div>
        </div>
      </div>

      {/* ── Activity links ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <Link
          to="/orders"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors border-b border-border/50"
        >
          <ShoppingBag className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-sm text-foreground">Мои заказы</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <Link
          to="/my-reviews"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-sm text-foreground">Мои отзывы</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* ── Personal info ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Личные данные
        </h2>
        <ProfileInfoForm profile={profile} onSave={updateProfile} />
      </div>

      {/* ── Seller status ── */}
      {isSeller ? (
        <SellerStatusCard
          onDeactivate={async () => {
            await updateProfile({ isSeller: false })
            await refreshUser()
          }}
        />
      ) : (
        <BecomeSellerCard
          onBecomeSeller={async () => {
            await updateProfile({ isSeller: true })
            await refreshUser()
          }}
        />
      )}

      {/* ── Addresses ── */}
      <AddressSection />

      {/* ── Security ── */}
      <ProfileSecuritySection onLogoutAll={logoutAll} onLogout={logout} />
    </div>
  )
}
