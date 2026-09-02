import { useState } from "react";
import { useStore } from "../lib/store";
import "./Onboarding.css";

export function Onboarding() {
  const { setFirstName } = useStore();
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setFirstName(trimmed);
  }

  return (
    <div className="onboarding">
      <span className="eyebrow" style={{ color: "rgba(246,244,255,0.7)" }}>
        Premier lancement
      </span>
      <h1 className="title-xl" style={{ fontSize: 34 }}>
        Pas de compte
      </h1>
      <p className="onboarding__intro">
        Tout reste sur le téléphone. Pas d'email, pas de mot de passe, pas de
        serveur : juste un prénom pour que l'appli sache à qui elle parle.
      </p>

      <form className="onboarding__card" onSubmit={submit}>
        <div className="onboarding__question">Tu t'appelles comment&nbsp;?</div>
        <input
          className="text-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ton prénom"
          autoFocus
        />
        <button className="button-primary" type="submit" disabled={!value.trim()}>
          C'est parti
        </button>
      </form>

      <div className="onboarding__storage">
        <span className="eyebrow" style={{ color: "var(--color-homework)" }}>
          Stockage local · pas de serveur
        </span>
        <p>
          Prénom, cours, récurrences et semaine de référence vivent dans le
          stockage du navigateur. Rien ne part ailleurs, l'appli marche hors
          ligne.
        </p>
      </div>

      <div className="onboarding__footer">
        <strong>À savoir&nbsp;:</strong> tes cours sont enregistrés sur ce
        téléphone.
      </div>
    </div>
  );
}
