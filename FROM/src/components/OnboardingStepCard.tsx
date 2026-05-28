import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OnboardingStep, TaskItem } from '../types';
import { Check, Send, Sparkles, FileText, Lock, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { sound } from '../utils/audio';

interface OnboardingStepCardProps {
  step: OnboardingStep;
  stepIndex: number;
  totalSteps: number;
  isLocked: boolean;
  onToggleTask: (taskId: string) => void;
  onSubmitReport: (reportText: string) => void;
}

export default function OnboardingStepCard({
  step,
  stepIndex,
  totalSteps,
  isLocked,
  onToggleTask,
  onSubmitReport,
}: OnboardingStepCardProps) {
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const allTasksDone = step.tasks.every(t => t.completed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!allTasksDone) {
      setErrorMsg('Пожалуйста, сначала отметьте все задачи шага как выполненные!');
      return;
    }

    if (report.trim().length < 15) {
      setErrorMsg('Опишите ваши действия подробнее (минимум 15 символов для отчета).');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    // Simulate submission flow
    setTimeout(() => {
      onSubmitReport(report);
      setIsSubmitting(false);
      setReport('');
    }, 1500);
  };

  const handleTaskClick = (task: TaskItem) => {
    if (isLocked || step.isCompleted) return;
    sound.playCheck();
    onToggleTask(task.id);
  };

  return (
    <div 
      id={`onboarding-step-card-${step.id}`}
      className={`relative w-full rounded-2xl border transition-all duration-300 ${
        step.isCompleted
          ? 'bg-slate-50/50 border-emerald-200/80 shadow-xs'
          : isLocked
          ? 'bg-slate-100/40 border-slate-200/50 opacity-60'
          : 'bg-white border-slate-250 shadow-sm'
      }`}
    >
      {/* Locked Overlay Mask */}
      {isLocked && (
        <div className="absolute inset-x-0 top-0 bottom-0 bg-slate-50/40 backdrop-blur-[0.5px] rounded-2xl flex flex-col items-center justify-center z-10 p-6 text-center select-none">
          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-555 flex items-center justify-center mb-2.5 shadow-xs border border-slate-300/40">
            <Lock className="w-4 h-4" />
          </div>
          <p className="text-[13px] font-bold text-slate-700 leading-tight">Этот шаг заблокирован</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
            Выполните предыдущий шаг и отправьте отчёт, чтобы открыть доступ к этому разделу.
          </p>
        </div>
      )}

      {/* Ribbon / Status Tag */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10.5px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold border border-slate-200/40">
            Шаг {stepIndex + 1} из {totalSteps}
          </span>
          {step.isCompleted ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full select-none">
              <Check className="w-3 h-3 stroke-[3]" />
              Выполнен
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full select-none">
              <Clock className="w-3 h-3" />
              В процессе
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          ООО «Джи Эм Трейд» Onboarding Base
        </span>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Core Description block */}
        <div className="space-y-2">
          <h3 className="text-[17px] font-extrabold text-slate-900 tracking-tight leading-snug">
            {step.title}
          </h3>
          <p className="text-[13.5px] text-slate-600 leading-relaxed font-normal">
            {step.description}
          </p>
        </div>

        {/* Task Checklist cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">Учебные чек-листы этапа</span>
            <span className="font-mono text-[11.5px] text-slate-500 font-bold">
              {step.tasks.filter(t => t.completed).length} из {step.tasks.length} зафиксировано
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {step.tasks.map((task) => {
              const isChecked = task.completed;
              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  disabled={isLocked || step.isCompleted}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3.5 transition-all outline-none text-slate-700 ${
                    step.isCompleted
                      ? 'bg-slate-100/60 border-slate-200/50 cursor-not-allowed opacity-80'
                      : isChecked
                      ? 'bg-blue-50/15 border-blue-100 hover:border-blue-200 cursor-pointer shadow-2xs'
                      : 'bg-slate-50/60 border-slate-250/50 hover:bg-slate-50 hover:border-slate-350 cursor-pointer'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                    isChecked
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>
                  <span className={`text-[12.5px] leading-snug font-medium transition-colors ${
                    isChecked ? 'text-slate-600 line-through decoration-slate-300' : 'text-slate-800'
                  }`}>
                    {task.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Report section */}
        <div className="border-t border-slate-150 pt-5 space-y-4">
          {!step.isCompleted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11.5px] uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Отчет руководителя о прохождении
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Контрольно-пропускной рубеж</span>
                </div>
                
                <textarea
                  value={report}
                  onChange={(e) => {
                    setReport(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  disabled={isSubmitting}
                  placeholder="Опишите кратко, что конкретно вы сделали по задачам этапа (например, настроен VPN докер, отправлен SSH ключ во вложении)..."
                  className="w-full h-32 px-4 py-3.5 text-[13px] bg-white border border-slate-250 rounded-xl shadow-inner-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-sans leading-relaxed"
                />
              </div>

              {errorMsg && (
                <motion.p
                  initial={{ y: 2, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg py-2 px-3 flex items-center gap-1.5"
                >
                  <span>⚠️</span> {errorMsg}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-slate-900 border border-slate-950 text-white rounded-xl text-[12.5px] font-bold hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:bg-slate-300 disabled:border-slate-350 disabled:text-slate-500 disabled:pointer-events-none cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Верификация отчета системой...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Отправить отчет на согласование</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-800">
                  Ваш отчет успешно утвержден куратором!
                </span>
                {step.completedAt && (
                  <span className="text-[10px] text-emerald-600/80 font-medium ml-auto">
                    {step.completedAt}
                  </span>
                )}
              </div>
              <div className="p-3 bg-white/70 border border-emerald-100/45 rounded-lg">
                <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide leading-none mb-1">Текст отчета:</p>
                <p className="text-[12.5px] text-slate-700 italic leading-relaxed">
                  «{step.userFeedback}»
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
