import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, PlusCircle, Building2,
  LogOut, GraduationCap, BarChart2, ClipboardList, Menu, X,
} from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, canControl, canCreateCourse, displayName, type User } from '@entities/user/model/types';
import { useCourses } from '@entities/course/model/CoursesContext';
import { useOnboarding } from '@entities/onboarding/model/OnboardingContext';
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
      { to: '/onboarding/manage',     label: 'Онбординг',  icon: ClipboardList, visible: canControl },
      { to: '/company',               label: 'Компания',    icon: Building2,     visible: canCreateCourse },
      { to: '/control',               label: 'Контроль',    icon: BarChart2,     visible: canControl },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

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
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on navigation
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const userIsAdmin = isAdmin(user);
  const pendingCount = userIsAdmin ? courses.filter(c => c.status === 'pending').length : 0;
  const myOnboardingBadge = myAssignments.filter(a => a.status === 'in_progress').length;
  const managedBadge = managedAssignments.filter(a => a.status === 'in_progress').length;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const roleName = user.employee?.role.name ?? user.type.toLowerCase();

  const navContent = (
    <>
      <div className={styles.logo}>
        <GraduationCap size={22} strokeWidth={2} className={styles.logoIcon} />
        <span className={styles.logoText}>GlobalLearn</span>
        {/* Close button — only visible on mobile */}
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
