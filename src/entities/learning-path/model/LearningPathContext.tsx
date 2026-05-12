import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import type { LearningPath, LearningPathStep, PathTargetType } from './types';
import { learningPathApi } from '../api/learningPathApi';
import { useUser } from '@entities/user/model/UserContext';
import { isAdmin, isDepartmentHead, isDivisionHead, isSeniorManager, displayName } from '@entities/user/model/types';

interface CreatePathDto {
  title: string;
  description: string;
  targetType: PathTargetType;
  targetDepartmentId?: string | null;
  targetDepartmentName?: string | null;
  targetDivisionId?: string | null;
  targetDivisionName?: string | null;
  steps: LearningPathStep[];
  status: 'draft' | 'published';
}

interface LearningPathContextValue {
  paths: LearningPath[];
  /** Пути, видимые текущему пользователю (по целевой аудитории) */
  visiblePaths: LearningPath[];
  /** Пути, созданные текущим пользователем (для управления) */
  myPaths: LearningPath[];
  isLoading: boolean;
  canCreate: boolean;
  createPath: (dto: CreatePathDto) => Promise<LearningPath>;
  publishPath: (id: string) => Promise<void>;
  deletePath: (id: string) => Promise<void>;
  updateSteps: (id: string, steps: LearningPathStep[]) => Promise<void>;
}

const LearningPathContext = createContext<LearningPathContextValue | undefined>(undefined);

/** Проверяет, должен ли пользователь видеть данный path */
function isPathVisibleTo(path: LearningPath, user: ReturnType<typeof useUser>['user']): boolean {
  if (path.status !== 'published') return false;
  if (user.type !== 'EMPLOYEE') return false;

  const emp = user.employee;
  if (!emp) return false;

  switch (path.targetType) {
    case 'all':
      return true;
    case 'department':
      return emp.department.id === path.targetDepartmentId;
    case 'division':
      return emp.division.id === path.targetDivisionId;
    case 'managers':
      // Только менеджеры из указанного отдела
      return (
        emp.division.id === path.targetDivisionId &&
        (emp.role.name === 'manager' || emp.role.name === 'senior_manager')
      );
    default:
      return false;
  }
}

export function LearningPathProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await learningPathApi.getPaths();
    setPaths(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const canCreate =
    isAdmin(user) ||
    isDepartmentHead(user) ||
    isDivisionHead(user) ||
    isSeniorManager(user);

  const visiblePaths = paths.filter(p => isPathVisibleTo(p, user));
  const myPaths = paths.filter(p => p.createdBy === user.id || p.createdBy === 'user-admin');

  const createPath = async (dto: CreatePathDto): Promise<LearningPath> => {
    const path = await learningPathApi.createPath({
      ...dto,
      createdBy: user.id,
      createdByName: displayName(user),
    });
    setPaths(prev => [...prev, path]);
    return path;
  };

  const publishPath = async (id: string) => {
    const updated = await learningPathApi.publishPath(id);
    setPaths(prev => prev.map(p => p.id === id ? updated : p));
  };

  const deletePath = async (id: string) => {
    await learningPathApi.deletePath(id);
    setPaths(prev => prev.filter(p => p.id !== id));
  };

  const updateSteps = async (id: string, steps: LearningPathStep[]) => {
    const updated = await learningPathApi.updateSteps(id, steps);
    setPaths(prev => prev.map(p => p.id === id ? updated : p));
  };

  return (
    <LearningPathContext.Provider value={{
      paths,
      visiblePaths,
      myPaths,
      isLoading,
      canCreate,
      createPath,
      publishPath,
      deletePath,
      updateSteps,
    }}>
      {children}
    </LearningPathContext.Provider>
  );
}

export function useLearningPaths() {
  const ctx = useContext(LearningPathContext);
  if (!ctx) throw new Error('useLearningPaths must be inside <LearningPathProvider>');
  return ctx;
}
