import Link from "next/link";

import { reviewFacility, updateFacilityFromReview } from "@/app/actions";
import { getReviewQueue, summarizeReviewQueue } from "@/lib/facilities";

const facilityTypeOptions = [
  { value: "stable", label: "Stable" },
  { value: "riding_school", label: "Riding school" },
  { value: "harness_racing", label: "Harness racing" },
  { value: "stud_farm", label: "Stud farm" },
  { value: "loose_boarding", label: "Loose boarding" }
];

export default async function ReviewPage() {
  const items = await getReviewQueue();
  const summary = summarizeReviewQueue(items);

  return (
    <div className="pageStack">
      <section className="hero compact">
        <div className="heroContent">
          <div className="eyebrow">Admin review</div>
          <h1>Importgranskning</h1>
          <p>
            Den här vyn prioriterar poster som bör granskas först: svaga namn, inkomna claims och
            poster som redan fått intresse från användare.
          </p>
        </div>
      </section>

      <section className="statsRow">
        <article className="statCard">
          <strong>{summary.total}</strong>
          <span>poster i review-kön</span>
        </article>
        <article className="statCard">
          <strong>{summary.needsReview}</strong>
          <span>prioriterade för granskning</span>
        </article>
        <article className="statCard">
          <strong>{summary.weakNames}</strong>
          <span>svaga eller generiska namn</span>
        </article>
        <article className="statCard">
          <strong>{summary.claimed + summary.verified}</strong>
          <span>redan på väg mot högre kvalitet</span>
        </article>
      </section>

      <section className="resultsPanel">
        <div className="resultsHeader">
          <h2>Review-kö</h2>
          <p>
            Första moderationen är avsiktligt enkel: verifiera bra poster och avpublicera poster
            som inte ska synas publikt.
          </p>
        </div>
        <div className="reviewTable">
          <div className="reviewTableHeader">
            <span>Stall</span>
            <span>Status</span>
            <span>Källa</span>
            <span>Signal</span>
            <span>Åtgärd</span>
          </div>
          {items.map((item) => (
            <article key={item.id} className={`reviewRow ${item.needsReview ? "flagged" : ""}`}>
              <div className="reviewMain">
                <strong>{item.name}</strong>
                <span>
                  {item.municipality}, {item.region}
                </span>
                <span>{item.address}</span>
              </div>
              <div>
                <span
                  className={`statusBadge ${item.status === "verified" ? "verified" : "listed"}`}
                >
                  {item.status}
                </span>
                {!item.isActive ? <span className="inactiveNote">avpublicerad</span> : null}
              </div>
              <div className="reviewMeta">
                <span>{item.sourceLabel}</span>
                <span>{item.facilityType}</span>
              </div>
              <div className="reviewSignals">
                {item.hasWeakName ? <span className="warningPill">Svagt namn</span> : null}
                {item.claimCount > 0 ? <span className="pill">{item.claimCount} claims</span> : null}
                {item.applicationCount > 0 ? (
                  <span className="pill">{item.applicationCount} ansökningar</span>
                ) : null}
                {item.hasRidingHouse ? <span className="pill">Ridhus</span> : null}
                {item.hasPaddock ? <span className="pill">Paddock</span> : null}
              </div>
              <div className="reviewActions">
                <Link className="secondaryLink compactLink" href={`/stall/${item.slug}`}>
                  Öppna profil
                </Link>
                <Link className="secondaryLink compactLink" href={`/for-owners?facility=${item.id}`}>
                  Claim-länk
                </Link>
                <form action={reviewFacility}>
                  <input type="hidden" name="facilityId" value={item.id} />
                  <input type="hidden" name="actionType" value="approve" />
                  <button className="primaryButton compactLink" type="submit">
                    Verifiera
                  </button>
                </form>
                <form action={reviewFacility}>
                  <input type="hidden" name="facilityId" value={item.id} />
                  <input type="hidden" name="actionType" value={item.isActive ? "deactivate" : "restore"} />
                  <button className="secondaryLink compactLink" type="submit">
                    {item.isActive ? "Avpublicera" : "Återställ"}
                  </button>
                </form>
              </div>
              <form action={updateFacilityFromReview} className="reviewEditForm">
                <input type="hidden" name="facilityId" value={item.id} />
                <label className="field">
                  <span>Namn</span>
                  <input name="name" defaultValue={item.name} required />
                </label>
                <label className="field">
                  <span>Typ</span>
                  <select name="facilityType" defaultValue={item.facilityType}>
                    {facilityTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Adress</span>
                  <input name="address" defaultValue={item.address} />
                </label>
                <label className="field reviewEditWide">
                  <span>Kort beskrivning</span>
                  <textarea name="description" rows={3} defaultValue={item.description} />
                </label>
                <button className="primaryButton compactLink" type="submit">
                  Spara ändringar
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
