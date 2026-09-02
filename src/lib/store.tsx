import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Course, Homework } from "./types";
import { loadData, saveCourses, saveFirstName, saveHomework } from "./storage";

interface StoreValue extends AppData {
  setFirstName: (name: string) => void;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  removeCourse: (id: string) => void;
  addHomework: (hw: Homework) => void;
  toggleHomework: (id: string) => void;
  removeHomework: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  const setFirstName = useCallback((name: string) => {
    saveFirstName(name);
    setData((d) => ({ ...d, settings: { ...d.settings, firstName: name } }));
  }, []);

  const addCourse = useCallback((course: Course) => {
    setData((d) => {
      const courses = [...d.courses, course];
      saveCourses(courses);
      return { ...d, courses };
    });
  }, []);

  const updateCourse = useCallback((course: Course) => {
    setData((d) => {
      const courses = d.courses.map((c) => (c.id === course.id ? course : c));
      saveCourses(courses);
      return { ...d, courses };
    });
  }, []);

  const removeCourse = useCallback((id: string) => {
    setData((d) => {
      const courses = d.courses.filter((c) => c.id !== id);
      saveCourses(courses);
      return { ...d, courses };
    });
  }, []);

  const addHomework = useCallback((hw: Homework) => {
    setData((d) => {
      const homework = [...d.homework, hw];
      saveHomework(homework);
      return { ...d, homework };
    });
  }, []);

  const toggleHomework = useCallback((id: string) => {
    setData((d) => {
      const homework = d.homework.map((h) =>
        h.id === id ? { ...h, done: !h.done } : h,
      );
      saveHomework(homework);
      return { ...d, homework };
    });
  }, []);

  const removeHomework = useCallback((id: string) => {
    setData((d) => {
      const homework = d.homework.filter((h) => h.id !== id);
      saveHomework(homework);
      return { ...d, homework };
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      setFirstName,
      addCourse,
      updateCourse,
      removeCourse,
      addHomework,
      toggleHomework,
      removeHomework,
    }),
    [
      data,
      setFirstName,
      addCourse,
      updateCourse,
      removeCourse,
      addHomework,
      toggleHomework,
      removeHomework,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
