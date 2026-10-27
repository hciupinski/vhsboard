const disciplines = ["SNOW", "SKATE", "SKIM", "SURF"];

export function ContactDisciplines() {
  return (
    <div className="contact-disciplines font-display text-border" aria-hidden="true">
      {disciplines.map((discipline) => (
        <span key={discipline}>{discipline}</span>
      ))}
    </div>
  );
}
