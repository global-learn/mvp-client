import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, PlusCircle, Users, Building2,
  LogOut, GraduationCap, BarChart2, MessageSquare,
  Search, ChevronRight,
} from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, canControl, canCreateCourse, canManageClients, displayName, type User } from '@entities/user/model/types';
import { useCourses } from '@entities/course/model/CoursesContext';
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
      { to: '/dashboard',      label: 'Главная',     icon: Home,          visible: () => true },
      { to: '/courses',        label: 'Курсы',       icon: BookOpen,      visible: () => true },
      { to: '/courses/create', label: 'Создать курс', icon: PlusCircle,   visible: canCreateCourse },
    ],
  },
  {
    label: 'Управление',
    items: [
      { to: '/clients', label: 'Клиенты',  icon: Users,        visible: canManageClients },
      { to: '/company', label: 'Компания', icon: Building2,    visible: canCreateCourse },
      { to: '/control', label: 'Контроль', icon: BarChart2,    visible: canControl },
    ],
  },
  {
    label: 'Коммуникации',
    items: [
      { to: '/chat', label: 'Чат', icon: MessageSquare, visible: u => u.type === 'EMPLOYEE' },
    ],
  },
];

// Flatten all items for active-state lookup
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
  const [query, setQuery] = useState('');

  const userIsAdmin = isAdmin(user);
  const pendingCount = userIsAdmin
    ? courses.filter(c => c.status === 'pending').length
    : 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const roleName = user.employee?.role.name ?? user.type.toLowerCase();
  const q = query.toLowerCase();

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <GraduationCap size={18} strokeWidth={2.5} />
        </div>
        <span className={styles.logoText}>GlobalLearn</span>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <Search size={14} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Найти раздел..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Navigation groups */}
      <nav className={styles.nav}>
        {NAV_GROUPS.map((group, gi) => {
          const visible = group.items.filter(item =>
            item.visible(user) && (q === '' || item.label.toLowerCase().includes(q))
          );
          if (visible.length === 0) return null;
          return (
            <div key={gi} className={styles.navGroup}>
              {group.label && <span className={styles.groupLabel}>{group.label}</span>}
              {visible.map(item => {
                const Icon = item.icon;
                const active = getIsActive(item.to, pathname);
                const hasBadge = item.to === '/courses' && pendingCount > 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`${styles.navItem} ${active ? styles.active : ''}`}
                  >
                    <Icon size={17} className={styles.navIcon} strokeWidth={active ? 2.5 : 2} />
                    <span className={styles.navLabel}>{item.label}</span>
                    {hasBadge && (
                      <span className={styles.badge}>{pendingCount}</span>
                    )}
                    {active && !hasBadge && (
                      <ChevronRight size={13} className={styles.activeArrow} />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer — user card + logout */}
      <div className={styles.footer}>
        <Link to="/profile" className={styles.userCard}>
          <UserAvatar user={user} size={34} />
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName(user)}</span>
            <span className={styles.userRole}>{roleName}</span>
          </div>
          <div className={styles.onlineDot} />
        </Link>
        <button className={styles.logoutBtn} onClick={() => { void handleLogout(); }}>
          <LogOut size={15} />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
