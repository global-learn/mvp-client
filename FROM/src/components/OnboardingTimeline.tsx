import { motion } from 'motion/react';
import { OnboardingStep } from '../types';
import { Check, Lock, Award, Flag } from 'lucide-react';
import { sound } from '../utils/audio';

interface OnboardingTimelineProps {
  steps: OnboardingStep[];
  activeStepIndex: number;
  onStepClick: (index: number) => void;
}

export default function OnboardingTimeline({
  steps,
  activeStepIndex,
  onStepClick,
}: OnboardingTimelineProps) {
  
  const completedCount = steps.filter(s => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleStepClick = (index: number, isLocked: boolean) => {
    if (isLocked) return;
    sound.playClick();
    onStepClick(index);
  };

  return (
    <div className="bg-white border border-slate-250 rounded-2xl p-5 md:p-6 shadow-sm sticky top-24 select-none">
      
      {/* Header Stat Ring */}
      <div className="pb-5 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-[12px] uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            Прохождение трека
          </span>
          <span className="font-mono text-[13px] font-extrabold text-blue-600">
            {progressPercent}%
          </span>
        </div>

        {/* Custom Slate/Blue progress bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50 p-[1px]">
          <div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10.5px] text-slate-450 font-bold leading-none pt-0.5">
          <span>Синхронизация с 1С холдинга</span>
          <span>Шагов: {completedCount} из {steps.length}</span>
        </div>
      </div>

      {/* Steps Pipeline Column */}
      <div className="mt-6 flex flex-col relative">
        {/* Draw central dividing timeline line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-slate-100 z-0" />

        {steps.map((step, index) => {
          const isCompleted = step.isCompleted;
          // Step is unlocked if it's completed, of if it is the first step, or if the previous step is completed
          const isUnlocked = index === 0 || steps[index - 1].isCompleted;
          const isActive = index === activeStepIndex;
          const isCurrentlyLocked = !isUnlocked;

          const doneTasks = step.tasks.filter(t => t.completed).length;

          return (
            <div 
              key={step.id}
              className="relative z-10 flex items-start gap-4 pb-6 last:pb-0"
            >
              {/* Left Circle Indicator */}
              <button
                disabled={isCurrentlyLocked}
                onClick={() => handleStepClick(index, isCurrentlyLocked)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all focus:outline-none ${
                  isCompleted
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs hover:bg-emerald-500'
                    : isActive
                    ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                    : isCurrentlyLocked
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-650 hover:border-slate-400 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrentlyLocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <span className="font-mono text-[12px] font-bold">{index + 1}</span>
                )}
              </button>

              {/* Right Content details */}
              <div className="flex flex-col text-left py-0.5">
                <button
                  disabled={isCurrentlyLocked}
                  onClick={() => handleStepClick(index, isCurrentlyLocked)}
                  className={`text-left outline-none cursor-pointer ${
                    isActive
                      ? 'text-blue-700 font-extrabold text-[12.5px] transition-all'
                      : isCurrentlyLocked
                      ? 'text-slate-400 font-semibold text-[12.5px]'
                      : 'text-slate-800 hover:text-blue-600 transition-colors font-bold text-[12.5px]'
                  }`}
                >
                  {step.title}
                </button>

                <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-slate-400 font-semibold">
                  <span>Чек-лист: {doneTasks} из {step.tasks.length}</span>
                  <span>•</span>
                  <span>{isCompleted ? 'Одобрено' : isCurrentlyLocked ? 'Не начато' : 'Активно'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fanfare badge on 100% complete */}
      {completedCount === steps.length && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-6 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-center shadow-md space-y-2 flex flex-col items-center"
        >
          <Award className="w-8 h-8 text-white animate-bounce mt-1" />
          <h4 className="text-[13px] font-extrabold tracking-tight">Онбординг полностью завершен!</h4>
          <p className="text-[10px] text-emerald-100 leading-normal font-medium max-w-[200px]">
            Вы успешно справились со всеми требованиями. Учетный статус активирован на боевом сервере!
          </p>
        </motion.div>
      )}
    </div>
  );
}
