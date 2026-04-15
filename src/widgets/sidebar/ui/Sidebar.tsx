import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, PlusCircle, Settings, LogOut, GraduationCap, User } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import styles from './Sidebar.module.css';

// next/link → Link from react-router-dom
// usePathname() → useLocation().pathname
// href → to

const navItems = [
  { to: '/dashboard', label: 'Главная', icon: Home },
  { to: '/courses', label: 'Мои курсы', icon: BookOpen },
  { to: '/courses/create', label: 'Создать курс', icon: PlusCircle },
  { to: '/settings', label: 'Настройки', icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useUser();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <GraduationCap size={28} />
        <span>GlobalLearn</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.to || pathname.startsWith(item.to + '/');
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
        <button className={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
