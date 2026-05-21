import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, X, BookOpen } from 'lucide-react';
import type { TrackCertificate } from '@entities/learning-path/model/types';
import { TrackCertificateModal } from './TrackCertificateModal';
import styles from './TrackCompletionModal.module.css';

interface Props {
  pathTitle: string;
  stepCount: number;
  certificate: TrackCertificate;
  onClose: () => void;
}

export function TrackCompletionModal({ pathTitle, stepCount, certificate, onClose }: Props) {
  const navigate = useNavigate();
  const [certOpen, setCertOpen] = useState(false);

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.card} onClick={e => e.stopPropagation()}>
          {/* Confetti */}
          <div className={styles.confetti} aria-hidden>
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className={styles.dot} style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>

          <button className={styles.closeBtn} onClick={onClose} title="Закрыть">
            <X size={18} />
          </button>

          <div className={styles.iconWrap}>
            <div className={styles.iconRing}>
              <CheckCircle2 size={48} className={styles.checkIcon} />
            </div>
          </div>

          <h2 className={styles.heading}>Трек завершён!</h2>
          <p className={styles.sub}>Вы прошли все курсы трека</p>
          <p className={styles.trackTitle}>«{pathTitle}»</p>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <BookOpen size={16} className={styles.statIcon} />
              <span className={styles.statValue}>{stepCount}</span>
              <span className={styles.statLabel}>курсов пройдено</span>
            </div>
          </div>

          <div className={styles.diplomaPreview}>
            <Award size={22} className={styles.diplomaIcon} />
            <div>
              <div className={styles.diplomaLabel}>Вам выдан диплом</div>
              <div className={styles.diplomaName}>{pathTitle}</div>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={() => setCertOpen(true)}>
              <Award size={16} />
              Открыть диплом
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => { navigate('/profile'); onClose(); }}
            >
              Мои достижения
            </button>
            <button
              className={styles.btnGhost}
              onClick={() => { navigate('/learning-paths'); onClose(); }}
            >
              Все треки
            </button>
          </div>
        </div>
      </div>

      {certOpen && (
        <TrackCertificateModal certificate={certificate} onClose={() => setCertOpen(false)} />
      )}
    </>
  );
}
