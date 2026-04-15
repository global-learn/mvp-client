import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, PlusCircle, Users, Building2,
  UserCircle, Settings, LogOut, GraduationCap,
} from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, displayName, type User } from '@entities/user/model/types';
import { UserAvatar } from '@entities/user/ui/UserAvatar';
import styles from './Sidebar.module.css';

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  visible: (user: User) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',      label: 'Главная',      icon: Home,       visible: () => true },
  { to: '/courses',        label: 'Курсы',         icon: BookOpen,   visible: () => true },
  { to: '/courses/create', label: 'Создать курс',  icon: PlusCircle, visible: isAdmin },
  { to: '/clients',        label: 'Клиенты',       icon: Users,      visible: u => u.type === 'EMPLOYEE' },
  { to: '/company',        label: 'Компания',      icon: Building2,  visible: isAdmin },
  { to: '/profile',        label: 'Профиль',       icon: UserCircle, visible: () => true },
  { to: '/settings',       label: 'Настройки',     icon: Settings,   visible: () => true },
];

// Более специфичный nav item всегда побеждает.
// /courses/create → /courses не активен, /courses/create активен.
function getIsActive(itemTo: string, pathname: string): boolean {
  if (pathname === itemTo) return true;
  if (!pathname.startsWith(itemTo + '/')) return false;
  return !NAV_ITEMS.some(other => other.to !== itemTo && pathname.startsWith(other.to));
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(item => item.visible(user));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const roleName = user.employee?.role.name ?? user.type.toLowerCase();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <GraduationCap size={28} />
        <span>GlobalLearn</span>
      </div>

      <nav className={styles.nav}>
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = getIsActive(item.to, pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link to="/profile" className={styles.profile}>
          <UserAvatar user={user} size={36} />
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{displayName(user)}</span>
            <span className={styles.profileRole}>{roleName}</span>
          </div>
        </Link>
        <button className={styles.logoutBtn} onClick={() => { void handleLogout(); }}>
          <LogOut size={20} />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
