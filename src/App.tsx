import { HashRouter, Route, Routes } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import { NavBar } from "./components/NavBar";
import { Onboarding } from "./screens/Onboarding";
import { Today } from "./screens/Today";
import { Courses } from "./screens/Courses";
import { CourseForm } from "./screens/CourseForm";
import { Homework } from "./screens/Homework";
import { Settings } from "./screens/Settings";

function AppShell() {
  const { settings } = useStore();

  if (!settings.firstName) {
    return <Onboarding />;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/cours" element={<Courses />} />
        <Route path="/cours/nouveau" element={<CourseForm />} />
        <Route path="/cours/:id" element={<CourseForm />} />
        <Route path="/devoirs" element={<Homework />} />
        <Route path="/reglages" element={<Settings />} />
      </Routes>
      <NavBar />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </StoreProvider>
  );
}
