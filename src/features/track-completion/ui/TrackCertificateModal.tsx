import { GraduationCap, Award, Printer, X, BookOpen } from 'lucide-react';
import type { TrackCertificate } from '@entities/learning-path/model/types';
import styles from './TrackCertificateModal.module.css';

interface Props {
  certificate: TrackCertificate;
  onClose: () => void;
}

export function TrackCertificateModal({ certificate, onClose }: Props) {
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.wrapper} onClick={e => e.stopPropagation()}>
        <div className={styles.toolbar}>
          <button className={styles.printBtn} onClick={() => window.print()}>
            <Printer size={15} />
            Распечатать
          </button>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.cert} id="track-certificate-print">
          <div className={styles.certHeader}>
            <GraduationCap size={40} className={styles.logoIcon} />
            <span className={styles.logoText}>GlobalLearn</span>
          </div>

          <div className={styles.divider} />

          <p className={styles.certLabel}>ДИПЛОМ О ЗАВЕРШЕНИИ ТРЕКА</p>

          <p className={styles.certIntro}>Настоящим удостоверяется, что</p>

          <h2 className={styles.userName}>{certificate.userName}</h2>

          <p className={styles.certMid}>успешно завершил(а) учебный трек</p>

          <h3 className={styles.trackTitle}>«{certificate.pathTitle}»</h3>

          <div className={styles.coursesNote}>
            <BookOpen size={14} className={styles.coursesIcon} />
            <span>пройдено {certificate.stepCount} {pluralizeCourses(certificate.stepCount)}</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.certFooter}>
            <div className={styles.footerItem}>
              <Award size={18} className={styles.footerIcon} />
              <span className={styles.footerLabel}>Дата выдачи</span>
              <span className={styles.footerValue}>{issuedDate}</span>
            </div>
            <div className={styles.footerItem}>
              <span className={styles.footerLabel}>Номер</span>
              <span className={styles.footerValue} style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                {certificate.id.toUpperCase()}
              </span>
            </div>
          </div>

          <div className={styles.badge}>
            <GraduationCap size={30} />
          </div>
        </div>
      </div>
    </div>
  );
}

function pluralizeCourses(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'курсов';
  if (mod10 === 1) return 'курс';
  if (mod10 >= 2 && mod10 <= 4) return 'курса';
  return 'курсов';
}
