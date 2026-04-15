import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@entities/user/model/UserContext';
import { CourseForm } from '@widgets/course-form/ui/CourseForm';

// Page "Создание курса" — /courses/create
// ---------------------------------------------------------------
// Защита маршрута: если пользователь не admin — редирект на список.
// В реальном проекте это делает компонент <ProtectedRoute> в роутере,
// но для начала такой подход тоже работает.

export function CourseCreatePage() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user.role !== 'admin') {
      // replace: true — заменяем запись в истории браузера, не добавляем новую.
      // Нажатие "назад" вернёт на список, а не зациклит на этой странице.
      navigate('/courses', { replace: true });
    }
  }, [user.role, navigate]);

  // Пока useEffect не отработал — не рендерим ничего (чтобы форма не мигала)
  if (user.role !== 'admin') return null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a202c', margin: '0 0 8px' }}>
        Новый курс
      </h1>
      <p style={{ color: '#718096', fontSize: 14, margin: '0 0 36px' }}>
        Заполни данные и опубликуй курс для сотрудников
      </p>
      <CourseForm />
    </div>
  );
}
