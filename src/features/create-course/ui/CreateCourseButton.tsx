import { useNavigate } from 'react-router-dom';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin } from '@entities/user/model/types';

// Видна только admin (EMPLOYEE с role.name === 'admin').
// Компонент сам знает кому показываться — не нужно дублировать проверку снаружи.

export function CreateCourseButton() {
  const { user } = useUser();
  const navigate = useNavigate();

  if (!isAdmin(user)) return null;

  return (
    <button
      onClick={() => navigate('/courses/create')}
      style={{
        padding: '10px 20px',
        borderRadius: 8,
        border: 'none',
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      + Создать курс
    </button>
  );
}
