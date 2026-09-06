export function WelcomeHero({ hasDocs }: { hasDocs: boolean }) {
  return (
    <div className={`welcome${hasDocs ? " welcome-has-docs" : ""}`}>
      <h1>Library</h1>
      <p>Your pages on this device.</p>
    </div>
  );
}
