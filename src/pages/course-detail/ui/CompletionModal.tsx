import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, X } from 'lucide-react';
import type { Certificate } from '@entities/course/model/types';
import { CertificateModal } from '@features/certificate/ui/CertificateModal';
import styles from './CompletionModal.module.css';

interface Props {
  courseTitle: string;
  certificate: Certificate | undefined;
  onClose: () => void;
}

export function CompletionModal({ courseTitle, certificate, onClose }: Props) {
  const navigate = useNavigate();
  const [certOpen, setCertOpen] = useState(false);

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.card} onClick={e => e.stopPropagation()}>
          {/* Confetti dots */}
          <div className={styles.confetti} aria-hidden>
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className={styles.dot} style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>

          <button className={styles.closeBtn} onClick={onClose} title="Закрыть">
            <X size={18} />
          </button>

          <div className={styles.iconWrap}>
            <CheckCircle2 size={52} className={styles.checkIcon} />
          </div>

          <h2 className={styles.heading}>Поздравляем! 🎉</h2>
          <p className={styles.sub}>Вы успешно прошли курс</p>
          <p className={styles.courseTitle}>«{courseTitle}»</p>

          {certificate && (
            <div className={styles.certPreview}>
              <Award size={20} className={styles.certIcon} />
              <div>
                <div className={styles.certLabel}>Сертификат выдан</div>
                <div className={styles.certName}>{certificate.courseTitle}</div>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            {certificate && (
              <button className={styles.btnPrimary} onClick={() => setCertOpen(true)}>
                <Award size={16} />
                Открыть сертификат
              </button>
            )}
            <button
              className={styles.btnSecondary}
              onClick={() => { navigate('/profile'); onClose(); }}
            >
              Мои сертификаты
            </button>
            <button
              className={styles.btnGhost}
              onClick={() => { navigate('/courses'); onClose(); }}
            >
              К списку курсов
            </button>
          </div>
        </div>
      </div>

      {certOpen && certificate && (
        <CertificateModal certificate={certificate} onClose={() => setCertOpen(false)} />
      )}
    </>
  );
}
