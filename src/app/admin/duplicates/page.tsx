import Link from "next/link";

import { DuplicateActions } from "@/components/duplicate-actions";
import { getDuplicateCandidates, getResolvedDuplicateDecisions } from "@/lib/facilities";

export default async function DuplicatesPage() {
  const candidates = await getDuplicateCandidates();
  const decisions = await getResolvedDuplicateDecisions();

  return (
    <div className="pageStack">
      <section className="hero compact">
        <div className="heroContent">
          <div className="eyebrow">Admin duplicates</div>
          <h1>Möjliga dubletter</h1>
          <p>
            Första dublettvyn använder namnlikhet, kommun och geografisk närhet för att peka ut
            poster som sannolikt behöver slås ihop manuellt.
          </p>
        </div>
      </section>

      <section className="resultsPanel">
        <div className="resultsHeader">
          <h2>Misstänkta dublettpar</h2>
          <p>
            Inga merges sker automatiskt ännu. Den här vyn är till för bedömning innan vi bygger
            riktig merge-logik.
          </p>
        </div>
        <div className="duplicateList">
          {candidates.map((candidate) => (
            <article
              key={`${candidate.primaryId}-${candidate.secondaryId}`}
              className="duplicateCard"
            >
              <div className="duplicateHeader">
                <span className="warningPill">{candidate.reason}</span>
                <span className="pill">score {candidate.score.toFixed(2)}</span>
                {candidate.distanceKm !== null ? (
                  <span className="pill">{candidate.distanceKm} km</span>
                ) : null}
              </div>
              <div className="duplicateGrid">
                <div className="duplicateSide">
                  <strong>{candidate.primaryName}</strong>
                  <span>
                    {candidate.primaryMunicipality}, {candidate.primaryRegion}
                  </span>
                  <span>{candidate.primarySourceLabel}</span>
                  <Link className="secondaryLink compactLink" href={`/stall/${candidate.primarySlug}`}>
                    Öppna profil A
                  </Link>
                </div>
                <div className="duplicateSide">
                  <strong>{candidate.secondaryName}</strong>
                  <span>
                    {candidate.secondaryMunicipality}, {candidate.secondaryRegion}
                  </span>
                  <span>{candidate.secondarySourceLabel}</span>
                  <Link className="secondaryLink compactLink" href={`/stall/${candidate.secondarySlug}`}>
                    Öppna profil B
                  </Link>
                </div>
              </div>
              <DuplicateActions
                primaryId={candidate.primaryId}
                secondaryId={candidate.secondaryId}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="resultsPanel">
        <div className="resultsHeader">
          <h2>Historik</h2>
          <p>Visar de senaste dublettbesluten så att teamet kan följa vad som redan avgjorts.</p>
        </div>
        <div className="duplicateHistoryList">
          {decisions.map((decision) => (
            <article key={decision.pairKey} className="duplicateHistoryCard">
              <strong>
                {decision.leftName} / {decision.rightName}
              </strong>
              <span>
                {decision.decision === "merged"
                  ? `Merged, behöll ${decision.winnerName ?? "okänd vinnare"}`
                  : "Markerad som inte dublett"}
              </span>
              <span>{new Date(decision.createdAt).toLocaleString("sv-SE")}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
