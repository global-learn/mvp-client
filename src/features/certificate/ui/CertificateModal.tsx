import { Download, Printer, X } from 'lucide-react';
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

        <div className={styles.toolbar}>
          {certificate.fileUrl && (
            <a
              className={styles.printBtn}
              href={certificate.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download size={14} />
              Скачать PDF
            </a>
          )}
          <button className={styles.printBtn} onClick={() => window.print()}>
            <Printer size={14} />
            Распечатать
          </button>
          <button className={styles.closeBtn} onClick={onClose} title="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div className={styles.cert} id="certificate-print">
          {/* Ornamental corner pieces */}
          <div className={`${styles.corner} ${styles.cornerTL}`} />
          <div className={`${styles.corner} ${styles.cornerTR}`} />
          <div className={`${styles.corner} ${styles.cornerBL}`} />
          <div className={`${styles.corner} ${styles.cornerBR}`} />

          <div className={styles.inner}>
            {/* Header */}
            <div className={styles.header}>
              <svg className={styles.logoMark} viewBox="0 0 32 32" fill="none" aria-hidden>
                <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 20 L16 10 L24 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11 20 L21 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className={styles.orgName}>GlobalLearn</span>
            </div>

            {/* Subtitle label */}
            <p className={styles.certLabel}>СЕРТИФИКАТ О ПРОХОЖДЕНИИ КУРСА</p>

            {/* Top rule */}
            <div className={styles.rule}>
              <span className={styles.ruleOrnament}>✦</span>
            </div>

            {/* Body */}
            <p className={styles.intro}>Настоящим удостоверяется, что</p>

            <h2 className={styles.recipientName}>{certificate.employeeName}</h2>

            <p className={styles.body}>успешно завершил(а) обучение по программе курса</p>

            <h3 className={styles.courseName}>«{certificate.courseName}»</h3>

            {/* Bottom rule */}
            <div className={styles.rule}>
              <span className={styles.ruleOrnament}>✦</span>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <div className={styles.footerCol}>
                <span className={styles.footerLabel}>Дата выдачи</span>
                <span className={styles.footerValue}>{issuedDate}</span>
              </div>
              <div className={styles.footerDivider} />
              <div className={styles.footerCol}>
                <span className={styles.footerLabel}>Номер сертификата</span>
                <span className={styles.footerValueMono}>{certificate.id.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Wax seal */}
          <div className={styles.seal} aria-hidden>
            <div className={styles.sealRing}>
              <svg viewBox="0 0 80 80" className={styles.sealSvg}>
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
                <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="0.8" />
                <path d="M40 16 L43.5 27h11.5l-9.3 6.8 3.6 11L40 38l-9.3 6.8 3.6-11L25 27h11.5z"
                      fill="currentColor" />
              </svg>
              <span className={styles.sealText}>VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
