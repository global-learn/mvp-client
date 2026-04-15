import type { User } from '../model/types';
import { userInitials } from '../model/types';

// Переиспользуемый компонент аватара пользователя.
// Если у пользователя есть аватар с url — показывает фото.
// Если системный аватар (bgColor) — цветной круг с инициалами.
// Если аватара нет — круг цвета --primary с инициалами.

interface UserAvatarProps {
  user: User;
  size?: number; // px, default 40
  className?: string;
}

export function UserAvatar({ user, size = 40, className }: UserAvatarProps) {
  const initials = userInitials(user);
  const bgColor = user.avatar?.bgColor ?? 'var(--primary)';
  const url = user.avatar?.url;
  const fontSize = Math.round(size * 0.38);

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (url) {
    return (
      <div style={baseStyle} className={className}>
        <img
          src={url}
          alt={initials}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...baseStyle,
        background: bgColor,
        color: '#ffffff',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
      className={className}
    >
      {initials}
    </div>
  );
}
