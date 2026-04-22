import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CoursePlayer } from "./components/CoursePlayer";
import { sampleCourse } from "./data/course";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CoursePlayer course={sampleCourse} />
  </StrictMode>,
);
