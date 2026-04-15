import { X, Upload } from 'lucide-react';
import { useUser } from '@entities/user/model/UserContext';
import { userInitials, type UserAvatar } from '@entities/user/model/types';
import styles from './AvatarPicker.module.css';

// Системные аватары — цветные круги с инициалами пользователя.
// В продакшне: бэкенд вернёт список Avatar с isSystem: true и url (S3).
const SYSTEM_AVATARS: UserAvatar[] = [
  { id: 'sys-blue',   name: 'Синий',      isSystem: true, bgColor: '#4299e1' },
  { id: 'sys-green',  name: 'Зелёный',    isSystem: true, bgColor: '#48bb78' },
  { id: 'sys-orange', name: 'Оранжевый',  isSystem: true, bgColor: '#ed8936' },
  { id: 'sys-purple', name: 'Фиолетовый', isSystem: true, bgColor: '#9f7aea' },
  { id: 'sys-red',    name: 'Красный',    isSystem: true, bgColor: '#f56565' },
  { id: 'sys-teal',   name: 'Бирюзовый',  isSystem: true, bgColor: '#38b2ac' },
  { id: 'sys-pink',   name: 'Розовый',    isSystem: true, bgColor: '#ed64a6' },
  { id: 'sys-indigo', name: 'Индиго',     isSystem: true, bgColor: '#667eea' },
  { id: 'sys-dark',   name: 'Тёмный',     isSystem: true, bgColor: '#2d3748' },
];

interface AvatarPickerProps {
  onClose: () => void;
}

export function AvatarPicker({ onClose }: AvatarPickerProps) {
  const { user, updateAvatar } = useUser();
  const initials = userInitials(user);

  const handleSelect = (avatar: UserAvatar) => {
    updateAvatar(avatar);
    onClose();
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleBackdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Изменить аватар</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Системные аватары */}
        <section>
          <p className={styles.sectionLabel}>Выбрать цвет</p>
          <div className={styles.grid}>
            {SYSTEM_AVATARS.map(avatar => {
              const isSelected = user.avatar?.id === avatar.id;
              return (
                <button
                  key={avatar.id}
                  className={`${styles.avatarOption} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSelect(avatar)}
                  title={avatar.name}
                >
                  <div
                    className={styles.avatarCircle}
                    style={{ background: avatar.bgColor }}
                  >
                    {initials}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Загрузить своё — UI-заглушка */}
        <section className={styles.uploadSection}>
          <p className={styles.sectionLabel}>Загрузить фото</p>
          <div className={styles.uploadArea}>
            <Upload size={24} className={styles.uploadIcon} />
            <p className={styles.uploadText}>Перетащите фото или нажмите для выбора</p>
            <span className={styles.uploadBadge}>Скоро</span>
          </div>
        </section>
      </div>
    </div>
  );
}
