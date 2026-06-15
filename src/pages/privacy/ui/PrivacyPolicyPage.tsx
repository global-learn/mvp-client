import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const UPDATED_AT = '15 июня 2026 г.';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] subtle-dot-grid relative overflow-hidden antialiased">
      <Link
        to="/login"
        className="fixed top-4 left-4 sm:top-6 sm:left-8 z-20 flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Ко входу
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[760px] mx-auto px-5 sm:px-6 pt-20 sm:pt-24 pb-16"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/30">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-[22px] sm:text-[25px] font-bold tracking-tight text-slate-900">Global Learn</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_8px_48px_rgba(0,0,0,0.08)] p-6 sm:p-10">
          <header className="mb-8">
            <h1 className="text-[24px] sm:text-[30px] font-extrabold text-slate-900 tracking-[-0.035em] leading-tight">
              Политика конфиденциальности
            </h1>
            <p className="text-[13px] text-slate-400 mt-2">Последнее обновление: {UPDATED_AT}</p>
          </header>

          <div className="flex flex-col gap-7 text-[14.5px] leading-relaxed text-slate-600">
            <section>
              <p>
                Настоящая Политика конфиденциальности описывает, как корпоративная система
                обучения <b>Global Learn</b> (далее — «Сервис») собирает, использует и защищает
                персональные данные сотрудников. Используя Сервис, вы соглашаетесь с условиями
                настоящей Политики.
              </p>
            </section>

            <Section title="1. Какие данные мы собираем">
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Учётные данные: имя, корпоративный email, должность, роль.</li>
                <li>Организационная информация: департамент, отдел, дата приёма на работу.</li>
                <li>Данные об обучении: прогресс по курсам, результаты тестов, сертификаты.</li>
                <li>Данные онбординга: статусы шагов, фидбек, сообщения в чате с руководителем.</li>
                <li>Технические данные: данные сессии и cookies, необходимые для авторизации.</li>
              </ul>
            </Section>

            <Section title="2. Как мы используем данные">
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Предоставление доступа к курсам, онбордингу и сертификатам.</li>
                <li>Назначение обучения и контроль прогресса руководителями в рамках их полномочий.</li>
                <li>Формирование статистики и аналитики обучения внутри компании.</li>
                <li>Обеспечение безопасности и корректной работы Сервиса.</li>
              </ul>
            </Section>

            <Section title="3. Доступ к данным">
              <p>
                Доступ к персональным данным предоставляется в соответствии с ролью сотрудника.
                Руководители видят данные только тех сотрудников, которые входят в их зону
                ответственности (департамент, отдел или лично назначенные). Администраторы имеют
                доступ ко всем данным в объёме, необходимом для администрирования Сервиса.
              </p>
            </Section>

            <Section title="4. Хранение и защита">
              <p>
                Данные хранятся на защищённых серверах и обрабатываются с применением
                организационных и технических мер защиты. Авторизация осуществляется через
                защищённые сессии, доступ к данным ограничен по принципу минимальных привилегий.
              </p>
            </Section>

            <Section title="5. Права сотрудника">
              <p>
                Вы вправе запросить доступ к своим персональным данным, их уточнение или
                исправление, а также получить информацию о порядке их обработки. Для этого
                обратитесь к администратору Сервиса или в HR-отдел вашей компании.
              </p>
            </Section>

            <Section title="6. Изменения политики">
              <p>
                Мы можем периодически обновлять настоящую Политику. Актуальная версия всегда
                доступна на этой странице с указанием даты последнего обновления.
              </p>
            </Section>

            <Section title="7. Контакты">
              <p>
                По вопросам обработки персональных данных свяжитесь с администратором Сервиса
                по адресу{' '}
                <a href="mailto:privacy@globallearn.example" className="text-blue-600 font-medium hover:text-blue-700">
                  privacy@globallearn.example
                </a>.
              </p>
            </Section>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-blue-600 text-white text-[14px] font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/25"
            >
              Вернуться ко входу
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900 tracking-[-0.02em] mb-2.5">
        {title}
      </h2>
      {children}
    </section>
  );
}
