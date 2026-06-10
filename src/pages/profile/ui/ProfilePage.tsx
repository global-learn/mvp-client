import { useState } from 'react';
import { ExternalLink, Edit2, Building2, Users, Briefcase, CalendarDays, BookOpen } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { displayName, ROLE_LABELS, type EmployeeRole } from '@entities/user/model/types';
import { useCourses } from '@entities/course/model/CoursesContext';
import type { Certificate } from '@entities/course/model/types';
import { UserAvatar } from '@entities/user/ui/UserAvatar';
import { AvatarPicker } from '@widgets/avatar-picker/ui/AvatarPicker';
import { CertificateModal } from '@features/certificate/ui/CertificateModal';
import styles from './Profile.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function tenure(iso: string): string {
  const months = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0 && m === 0) return 'менее месяца';
  if (y === 0) return `${m} мес.`;
  if (m === 0) return `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'}`;
  return `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'} ${m} мес.`;
}

export function ProfilePage() {
  const { user } = useUser();
  const { enrollments, certificates } = useCourses();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openCert, setOpenCert]     = useState<Certificate | null>(null);

  const completed  = enrollments.filter(e => e.status === 'completed').length;
  const inProgress = enrollments.filter(e => e.status === 'in_progress').length;
  const total      = enrollments.length;

  const emp       = user.employee;
  const roleLabel = emp ? (ROLE_LABELS[emp.role.name as EmployeeRole] ?? emp.role.name) : null;

  return (
    <div className={styles.page}>

      {/* ── Hero card ──────────────────────────────────────────────── */}
      <div className={styles.hero}>
        {/* Avatar column */}
        <div className={styles.avatarCol}>
          <div className={styles.avatarWrap}>
            <UserAvatar user={user} size={96} />
            <button
              className={styles.editBtn}
              onClick={() => setPickerOpen(true)}
              title="Изменить аватар"
            >
              <Edit2 size={12} />
            </button>
          </div>
        </div>

        {/* Info column */}
        <div className={styles.infoCol}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{displayName(user)}</h1>
            <div className={styles.badges}>
              {roleLabel && <span className={styles.roleBadge}>{roleLabel}</span>}
              <span className={styles.typeBadge}>Сотрудник</span>
            </div>
          </div>

          <p className={styles.email}>{user.email}</p>

          {emp && (
            <div className={styles.orgMeta}>
              <span className={styles.orgItem}>
                <Building2 size={13} className={styles.orgIcon} />
                {emp.department.name}
              </span>
              <span className={styles.orgSep}>›</span>
              <span className={styles.orgItem}>
                <Users size={13} className={styles.orgIcon} />
                {emp.division.name}
              </span>
              {emp.position && (
                <>
                  <span className={styles.orgSep}>›</span>
                  <span className={styles.orgItem}>
                    <Briefcase size={13} className={styles.orgIcon} />
                    {emp.position.name}
                  </span>
                </>
              )}
            </div>
          )}

          {emp && (
            <div className={styles.tenureRow}>
              <CalendarDays size={13} className={styles.orgIcon} />
              <span>
                В компании <strong>{tenure(emp.employmentDate)}</strong>
                <span className={styles.sinceDate}> · с {formatDate(emp.employmentDate)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Biography ──────────────────────────────────────────────── */}
      {emp?.biography && (
        <div className={styles.bioCard}>
          <p className={styles.bioLabel}>О себе</p>
          <p className={styles.bioText}>{emp.biography}</p>
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className={styles.statsRow}>
        {[
          { val: completed,           label: 'Пройдено',      icon: <BookOpen size={18} /> },
          { val: inProgress,          label: 'В процессе',    icon: <BookOpen size={18} /> },
          { val: total,               label: 'Всего записей', icon: <BookOpen size={18} /> },
          { val: certificates.length, label: 'Сертификатов',  icon: <BookOpen size={18} /> },
        ].map(s => (
          <div key={s.label} className={styles.statCell}>
            <span className={styles.statVal}>{s.val}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Certificates ───────────────────────────────────────────── */}
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
                <div className={styles.certAccent} />
                <div className={styles.certBody}>
                  <span className={styles.certEyebrow}>Сертификат</span>
                  <span className={styles.certTitle}>{cert.courseName}</span>
                  <span className={styles.certDate}>
                    Выдан {new Date(cert.issuedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <ExternalLink size={14} className={styles.certArrow} />
              </button>
            ))}
          </div>
        )}
      </section>

      {pickerOpen && <AvatarPicker onClose={() => setPickerOpen(false)} />}
      {openCert   && <CertificateModal certificate={openCert} onClose={() => setOpenCert(null)} />}
    </div>
  );
}
