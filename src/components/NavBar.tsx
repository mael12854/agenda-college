import { NavLink } from "react-router-dom";
import "./NavBar.css";

const ITEMS = [
  { to: "/", label: "Aujourd'hui", icon: "▦" },
  { to: "/cours", label: "Cours", icon: "↻" },
  { to: "/devoirs", label: "Devoirs", icon: "!" },
  { to: "/reglages", label: "Réglages", icon: "…" },
];

export function NavBar() {
  return (
    <nav className="nav-bar">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            "nav-bar__item" + (isActive ? " nav-bar__item--active" : "")
          }
        >
          <span className="nav-bar__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
