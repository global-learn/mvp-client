import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, PlusCircle, Building2,
  LogOut, GraduationCap, BarChart2, ClipboardList, Menu, X, Bell,
  CheckCheck, BookMarked, Users2, CalendarClock, TrendingUp, Users,
} from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, canControl, canCreateCourse, displayName, type User } from '@entities/user/model/types';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useOnboarding } from '@entities/onboarding/model/OnboardingContext';
import { useNotifications } from '@entities/notification/model/NotificationContext';
import { notifLabel, notifDescription, notifRoute } from '@entities/notification/model/types';
import { UserAvatar } from '@entities/user/ui/UserAvatar';
import styles from './Sidebar.module.css';

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  visible: (user: User) => boolean;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/dashboard',      label: 'Главная',      icon: Home,       visible: () => true },
      { to: '/courses',        label: 'Курсы',         icon: BookOpen,   visible: () => true },
      { to: '/courses/create', label: 'Создать курс',  icon: PlusCircle, visible: canCreateCourse },
    ],
  },
  {
    label: 'Обучение',
    items: [
      { to: '/onboarding',     label: 'Мой онбординг',  icon: ClipboardList, visible: u => u.type === 'EMPLOYEE' },
    ],
  },
  {
    label: 'Управление',
    items: [
      { to: '/team',                  label: 'Моя команда', icon: Users,         visible: canControl },
      { to: '/onboarding/manage',     label: 'Онбординг',   icon: ClipboardList, visible: canControl },
      { to: '/company',               label: 'Компания',     icon: Building2,     visible: isAdmin },
      { to: '/control',               label: 'Контроль',     icon: BarChart2,     visible: canControl },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

const TYPE_ICON: Record<string, typeof Bell> = {
  ONBOARDING_ASSIGNED:           BookMarked,
  ONBOARDING_COMPLETED:          BookMarked,
  ONBOARDING_COMPLETED_MANAGER:  Users2,
  ONBOARDING_STEP_OVERDUE:       CalendarClock,
  ONBOARDING_STEP_OVERDUE_MANAGER: CalendarClock,
  COURSE_APPLICATION_APPROVED:   BookOpen,
  EMPLOYEE_PROMOTED:             TrendingUp,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function getIsActive(itemTo: string, pathname: string): boolean {
  if (pathname === itemTo) return true;
  if (!pathname.startsWith(itemTo + '/')) return false;
  return !ALL_ITEMS.some(other => other.to !== itemTo && pathname.startsWith(other.to));
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { courses } = useCourses();
  const { myAssignments, managedAssignments } = useOnboarding();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close drawer on navigation
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close notification panel when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const userIsAdmin = isAdmin(user);
  const pendingCount = userIsAdmin ? courses.filter(c => c.status === 'pending').length : 0;
  const myOnboardingBadge = myAssignments.filter(a => a.status === 'in_progress').length;
  const managedBadge = managedAssignments.filter(a => a.status === 'in_progress').length;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleNotifClick = async (id: string, type: string) => {
    await markRead(id);
    navigate(notifRoute(type));
    setNotifOpen(false);
  };

  const roleName = user.employee?.role.name ?? user.type.toLowerCase();

  const navContent = (
    <>
      <div className={styles.logo}>
        <GraduationCap size={22} strokeWidth={2} className={styles.logoIcon} />
        <span className={styles.logoText}>GlobalLearn</span>
        <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Закрыть меню">
          <X size={18} />
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV_GROUPS.map((group, gi) => {
          const visible = group.items.filter(item => item.visible(user));
          if (visible.length === 0) return null;
          return (
            <div key={gi} className={styles.navGroup}>
              {group.label && <span className={styles.groupLabel}>{group.label}</span>}
              {visible.map(item => {
                const Icon = item.icon;
                const active = getIsActive(item.to, pathname);
                const badgeCount =
                  item.to === '/courses' && pendingCount > 0 ? pendingCount
                  : item.to === '/onboarding' && myOnboardingBadge > 0 ? myOnboardingBadge
                  : item.to === '/onboarding/manage' && managedBadge > 0 ? managedBadge
                  : 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`${styles.navItem} ${active ? styles.active : ''}`}
                  >
                    <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                    <span>{item.label}</span>
                    {badgeCount > 0 && <span className={styles.badge}>{badgeCount}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className={styles.footer}>
        {/* Notification bell */}
        <div ref={panelRef} className={styles.notifWrap}>
          <button
            className={`${styles.notifBtn} ${notifOpen ? styles.notifBtnActive : ''}`}
            onClick={() => setNotifOpen(prev => !prev)}
          >
            <Bell size={17} />
            <span className={styles.notifBtnLabel}>Уведомления</span>
            {unreadCount > 0 && (
              <span className={styles.notifUnreadBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className={styles.notifPanel}>
              <div className={styles.notifHeader}>
                <span className={styles.notifTitle}>Уведомления</span>
                {unreadCount > 0 && (
                  <button
                    className={styles.markAllBtn}
                    onClick={() => { void markAllRead(); }}
                    title="Прочитать все"
                  >
                    <CheckCheck size={14} />
                    <span>Прочитать все</span>
                  </button>
                )}
              </div>

              <div className={styles.notifList}>
                {notifications.length === 0 ? (
                  <div className={styles.notifEmpty}>
                    <Bell size={22} className={styles.notifEmptyIcon} />
                    <span>Нет уведомлений</span>
                  </div>
                ) : notifications.map(n => {
                  const Icon = TYPE_ICON[n.type] ?? Bell;
                  const desc = notifDescription(n.type, n.payload);
                  const isUnread = !n.readAt;
                  return (
                    <button
                      key={n.id}
                      className={`${styles.notifItem} ${isUnread ? styles.notifItemUnread : ''}`}
                      onClick={() => { void handleNotifClick(n.id, n.type); }}
                    >
                      <div className={`${styles.notifIconWrap} ${isUnread ? styles.notifIconUnread : ''}`}>
                        <Icon size={14} />
                      </div>
                      <div className={styles.notifBody}>
                        <span className={styles.notifType}>{notifLabel(n.type)}</span>
                        {desc && <span className={styles.notifDesc}>{desc}</span>}
                        <span className={styles.notifTime}>{timeAgo(n.createdAt)}</span>
                      </div>
                      {isUnread && <span className={styles.notifDot} aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Link to="/profile" className={styles.profile}>
          <UserAvatar user={user} size={34} />
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{displayName(user)}</span>
            <span className={styles.profileRole}>{roleName}</span>
          </div>
        </Link>
        <button className={styles.logoutBtn} onClick={() => { void handleLogout(); }}>
          <LogOut size={17} />
          <span>Выйти</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className={styles.topBar}>
        <button
          className={styles.burgerBtn}
          onClick={() => setIsOpen(true)}
          aria-label="Открыть меню"
        >
          <Menu size={20} />
        </button>
        <div className={styles.topBarLogo}>
          <GraduationCap size={18} strokeWidth={2} className={styles.logoIcon} />
          <span className={styles.logoText}>GlobalLearn</span>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} aria-hidden />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {navContent}
      </aside>
    </>
  );
}
