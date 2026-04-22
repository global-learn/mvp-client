import { GraduationCap, Award, Printer, X } from 'lucide-react';
import type { Certificate } from '@entities/course/model/types';
import styles from './CertificateModal.module.css';

interface Props {
  certificate: Certificate;
  onClose: () => void;
}

export function CertificateModal({ certificate, onClose }: Props) {
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.wrapper} onClick={e => e.stopPropagation()}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <button className={styles.printBtn} onClick={() => window.print()}>
            <Printer size={15} />
            Распечатать
          </button>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Certificate paper */}
        <div className={styles.cert} id="certificate-print">
          {/* Header */}
          <div className={styles.certHeader}>
            <GraduationCap size={36} className={styles.logoIcon} />
            <span className={styles.logoText}>GlobalLearn</span>
          </div>

          {/* Decorative line */}
          <div className={styles.divider} />

          <p className={styles.certLabel}>СЕРТИФИКАТ О ПРОХОЖДЕНИИ КУРСА</p>

          <p className={styles.certIntro}>Настоящим удостоверяется, что</p>

          <h2 className={styles.userName}>{certificate.userName}</h2>

          <p className={styles.certMid}>успешно прошёл(а) курс</p>

          <h3 className={styles.courseTitle}>«{certificate.courseTitle}»</h3>

          <div className={styles.divider} />

          {/* Footer */}
          <div className={styles.certFooter}>
            <div className={styles.footerItem}>
              <Award size={18} className={styles.footerIcon} />
              <span className={styles.footerLabel}>Дата выдачи</span>
              <span className={styles.footerValue}>{issuedDate}</span>
            </div>
            <div className={styles.footerItem}>
              <span className={styles.footerLabel}>Номер</span>
              <span className={styles.footerValue} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {certificate.id.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Decorative badge */}
          <div className={styles.badge}>
            <Award size={28} />
          </div>
        </div>
      </div>
    </div>
  );
}
