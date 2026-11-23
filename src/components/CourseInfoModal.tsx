import { Link } from "react-router-dom";
import type { Course } from "../lib/types";
import { StatusBadge } from "./StatusBadge";
import "./ConfirmModal.css";
import "./CourseInfoModal.css";

export function CourseInfoModal({ course, onClose }: { course: Course; onClose: () => void }) {
  return (
    <div className="confirm-modal__overlay" role="presentation" onClick={onClose}>
      <div
        className="course-info-modal"
        role="dialog"
        aria-modal="true"
        aria-label={course.subject}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="course-info-modal__head">
          <span className="course-info-modal__time">
            {course.startTime} – {course.endTime}
          </span>
          <StatusBadge status={course.status} />
        </div>

        <h2 className="course-info-modal__title">{course.subject}</h2>

        {(course.teacher || course.room) && (
          <p className="course-info-modal__meta">
            {course.substituteFor && course.teacher
              ? `${course.teacher} (remplace ${course.substituteFor})`
              : course.teacher}
            {course.teacher && course.room ? " · " : ""}
            {course.room}
          </p>
        )}

        {course.note && <p className="course-info-modal__note">{course.note}</p>}

        <div className="course-info-modal__actions">
          <button type="button" className="button-ghost" onClick={onClose}>
            Fermer
          </button>
          <Link to={`/cours/${course.id}`} className="button-primary course-info-modal__edit">
            Modifier
          </Link>
        </div>
      </div>
    </div>
  );
}
