import { useNavigate } from 'react-router-dom';
import { useUser } from '@entities/user/model/UserContext';

// Feature "Создать курс"
// ---------------------------------------------------------------
// Видна только admin. Компонент сам знает кому показываться —
// удобнее чем дублировать проверку роли на каждой странице.
//
// Если user.role !== 'admin' — возвращаем null (React ничего не рендерит).
// Это называется "conditional rendering" — условный рендеринг.

export function CreateCourseButton() {
  const { user } = useUser();
  const navigate = useNavigate();

  if (user.role !== 'admin') return null;

  return (
    <button
      onClick={() => navigate('/courses/create')}
      style={{
        padding: '10px 20px',
        borderRadius: 8,
        border: 'none',
        background: '#48bb78',
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      + Создать курс
    </button>
  );
}
