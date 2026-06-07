import {useState} from 'react';
import {ExternalLink, Edit2} from 'lucide-react';
import {useUser} from '@entities/user/model/UserContext';
import {displayName, ROLE_LABELS, type EmployeeRole} from '@entities/user/model/types';
import {useCourses} from '@entities/course/model/CoursesContext';
import type {Certificate} from '@entities/course/model/types';
import {UserAvatar} from '@entities/user/ui/UserAvatar';
import {AvatarPicker} from '@widgets/avatar-picker/ui/AvatarPicker';
import {CertificateModal} from '@features/certificate/ui/CertificateModal';
import styles from './Profile.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'});
}

function tenure(iso: string): string {
  const months = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} мес.`;
  if (m === 0) return `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'}`;
  return `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'} ${m} мес.`;
}

export function ProfilePage() {
  const {user} = useUser();
  const {enrollments, certificates} = useCourses();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openCert, setOpenCert] = useState<Certificate | null>(null);

  const completed   = enrollments.filter(e => e.status === 'completed').length;
  const inProgress  = enrollments.filter(e => e.status === 'in_progress').length;
  const total       = enrollments.length;

  const emp       = user.employee;
  const roleLabel = emp ? (ROLE_LABELS[emp.role.name as EmployeeRole] ?? emp.role.name) : null;

  return (
    <div className={styles.page}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={styles.sidebar}>

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <UserAvatar user={user} size={88}/>
          <button
            className={styles.editBtn}
            onClick={() => setPickerOpen(true)}
            title="Изменить аватар"
          >
            <Edit2 size={12}/>
          </button>
        </div>

        <h1 className={styles.name}>{displayName(user)}</h1>
        <p className={styles.email}>{user.email}</p>

        <div className={styles.badges}>
          <span className={styles.typeBadge}>
            {user.type === 'EMPLOYEE' ? 'Сотрудник' : 'Клиент'}
          </span>
          {roleLabel && <span className={styles.roleBadge}>{roleLabel}</span>}
        </div>

        {/* Org info */}
        {emp && (
          <>
            <div className={styles.divider}/>
            <dl className={styles.infoList}>
              <div className={styles.infoRow}>
                <dt className={styles.infoKey}>Департамент</dt>
                <dd className={styles.infoVal}>{emp.department.name}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoKey}>Отдел</dt>
                <dd className={styles.infoVal}>{emp.division.name}</dd>
              </div>
              {emp.position && (
                <div className={styles.infoRow}>
                  <dt className={styles.infoKey}>Должность</dt>
                  <dd className={styles.infoVal}>{emp.position.name}</dd>
                </div>
              )}
            </dl>

            <div className={styles.divider}/>
            <dl className={styles.infoList}>
              {emp.birthDate && (
                <div className={styles.infoRow}>
                  <dt className={styles.infoKey}>Дата рождения</dt>
                  <dd className={styles.infoVal}>{formatDate(emp.birthDate)}</dd>
                </div>
              )}
              <div className={styles.infoRow}>
                <dt className={styles.infoKey}>В компании</dt>
                <dd className={styles.infoVal}>
                  {tenure(emp.employmentDate)}
                  <span className={styles.sinceDate}>с {new Date(emp.employmentDate).toLocaleDateString('ru-RU', {month: 'short', year: 'numeric'})}</span>
                </dd>
              </div>
            </dl>
          </>
        )}
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className={styles.main}>

        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            {val: completed,            label: 'Пройдено'},
            {val: inProgress,           label: 'В процессе'},
            {val: total,                label: 'Всего записей'},
            {val: certificates.length,  label: 'Сертификатов'},
          ].map(s => (
            <div key={s.label} className={styles.statCell}>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Certificates */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Сертификаты</h2>

          {certificates.length === 0 ? (
            <p className={styles.empty}>Появятся после 100% прохождения курса</p>
          ) : (
            <div className={styles.certList}>
              {certificates.map(cert => (
                <button
                  key={cert.id}
                  className={styles.certCard}
                  onClick={() => setOpenCert(cert)}
                >
                  <div className={styles.certAccent}/>
                  <div className={styles.certBody}>
                    <span className={styles.certEyebrow}>Сертификат</span>
                    <span className={styles.certTitle}>{cert.courseTitle}</span>
                    <span className={styles.certDate}>
                      Выдан {new Date(cert.issuedAt).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'})}
                    </span>
                  </div>
                  <ExternalLink size={14} className={styles.certArrow}/>
                </button>
              ))}
            </div>
          )}
        </section>

      </main>

      {pickerOpen && <AvatarPicker onClose={() => setPickerOpen(false)}/>}
      {openCert   && <CertificateModal certificate={openCert} onClose={() => setOpenCert(null)}/>}
    </div>
  );
}
