import { useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Edit2 } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { displayName } from '@entities/user/model/types';
import { useCourses } from '@entities/course/model/CoursesContext';
import { UserAvatar } from '@entities/user/ui/UserAvatar';
import { AvatarPicker } from '@widgets/avatar-picker/ui/AvatarPicker';
import styles from './Profile.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ProfilePage() {
  const { user } = useUser();
  const { enrollments } = useCourses();
  const [pickerOpen, setPickerOpen] = useState(false);

  const completed = enrollments.filter(e => e.status === 'completed').length;
  const inProgress = enrollments.filter(e => e.status === 'in_progress').length;
  const totalEnrolled = enrollments.length;

  const emp = user.employee;
  const roleName = emp?.role.name ?? user.type.toLowerCase();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Профиль</h1>

      {/* Основная карточка */}
      <div className={styles.card}>
        {/* Аватар + имя */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <UserAvatar user={user} size={80} />
            <button
              className={styles.editAvatarBtn}
              onClick={() => setPickerOpen(true)}
              title="Изменить аватар"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <div>
            <h2 className={styles.fullname}>{displayName(user)}</h2>
            <p className={styles.email}>{user.email}</p>
            <span className={styles.typeBadge}>
              {user.type === 'EMPLOYEE' ? 'Сотрудник' : 'Клиент'}
            </span>
          </div>
        </div>

        {/* Статистика курсов */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <CheckCircle2 size={20} className={styles.statIconGreen} />
            <span className={styles.statValue}>{completed}</span>
            <span className={styles.statLabel}>Пройдено</span>
          </div>
          <div className={styles.statItem}>
            <BookOpen size={20} className={styles.statIconBlue} />
            <span className={styles.statValue}>{inProgress}</span>
            <span className={styles.statLabel}>В процессе</span>
          </div>
          <div className={styles.statItem}>
            <Clock size={20} className={styles.statIconOrange} />
            <span className={styles.statValue}>{totalEnrolled}</span>
            <span className={styles.statLabel}>Всего записей</span>
          </div>
        </div>
      </div>

      {/* Информация о пользователе */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Личные данные</h3>
        <dl className={styles.infoGrid}>
          <dt className={styles.infoLabel}>Email</dt>
          <dd className={styles.infoValue}>{user.email}</dd>

          <dt className={styles.infoLabel}>Имя</dt>
          <dd className={styles.infoValue}>{user.fullname ?? '—'}</dd>

          <dt className={styles.infoLabel}>Тип аккаунта</dt>
          <dd className={styles.infoValue}>
            {user.type === 'EMPLOYEE' ? 'Сотрудник' : 'Клиент'}
          </dd>

          {emp && (
            <>
              <dt className={styles.infoLabel}>Роль</dt>
              <dd className={styles.infoValue}>
                <span className={styles.roleBadge}>{emp.role.name}</span>
              </dd>

              <dt className={styles.infoLabel}>Отдел</dt>
              <dd className={styles.infoValue}>{emp.department.name}</dd>

              <dt className={styles.infoLabel}>Дата рождения</dt>
              <dd className={styles.infoValue}>{formatDate(emp.birthDate)}</dd>

              <dt className={styles.infoLabel}>Принят</dt>
              <dd className={styles.infoValue}>{formatDate(emp.employmentDate)}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Модалка выбора аватара */}
      {pickerOpen && <AvatarPicker onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
