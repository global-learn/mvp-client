import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, PlusCircle, Settings, LogOut, GraduationCap, User } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import styles from './Sidebar.module.css';

type NavItem = { to: string; label: string; icon: typeof Home };

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Главная', icon: Home },
  { to: '/courses', label: 'Мои курсы', icon: BookOpen },
  { to: '/courses/create', label: 'Создать курс', icon: PlusCircle },
  { to: '/settings', label: 'Настройки', icon: Settings },
];

// Более специфичный nav item всегда побеждает.
// Пример: находимся на /courses/create.
//   /courses     → startsWith('/courses/') = true, НО /courses/create тоже есть в nav → не активен
//   /courses/create → точное совпадение → активен
// Пример: находимся на /courses/abc-123 (детальная страница).
//   /courses     → startsWith('/courses/') = true, нет более специфичного nav item → активен
function getIsActive(itemTo: string, pathname: string): boolean {
  if (pathname === itemTo) return true;
  if (!pathname.startsWith(itemTo + '/')) return false;
  return !navItems.some(other => other.to !== itemTo && pathname.startsWith(other.to));
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <GraduationCap size={28} />
        <span>GlobalLearn</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map(item => {
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
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <User size={18} />
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{user.name}</span>
            <span className={styles.profileRole}>{user.role}</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={() => { void handleLogout(); }}>
          <LogOut size={20} />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
