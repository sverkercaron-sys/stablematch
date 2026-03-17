import { changeListingStatus, saveListing } from "@/app/actions";
import { getListingFormFacilities, getListingsAdminItems } from "@/lib/facilities";

const statusOptions = ["draft", "active", "paused", "filled"] as const;

export default async function ListingsAdminPage() {
  const [listings, facilities] = await Promise.all([
    getListingsAdminItems(),
    getListingFormFacilities()
  ]);

  return (
    <div className="pageStack">
      <section className="hero compact">
        <div className="heroContent">
          <div className="eyebrow">Admin listings</div>
          <h1>Hantera annonser</h1>
          <p>
            Här skapar och uppdaterar ni de faktiska marketplace-objekten. En anläggning kan ha
            flera annonser över tid.
          </p>
        </div>
      </section>

      <section className="detailCard">
        <h2>Skapa ny annons</h2>
        <form action={saveListing} className="listingAdminForm">
          <label className="field">
            <span>Anläggning</span>
            <select name="facilityId" required defaultValue="">
              <option value="" disabled>
                Välj anläggning
              </option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} ({facility.municipality})
                  {facility.verified ? " - verifierad" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Titel</span>
            <input name="title" placeholder="Ledig boxplats med fullservice" required />
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue="draft">
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Boendeform</span>
            <select name="boardingMode" defaultValue="box">
              <option value="box">Box</option>
              <option value="loose">Lösdrift</option>
            </select>
          </label>
          <label className="field">
            <span>Pris SEK/mån</span>
            <input type="number" name="monthlyPriceSek" min="0" step="100" defaultValue="0" />
          </label>
          <label className="field">
            <span>Lediga platser</span>
            <input type="number" name="openSpots" min="0" step="1" defaultValue="1" />
          </label>
          <label className="field">
            <span>Inflytt från</span>
            <input type="date" name="availableFrom" />
          </label>
          <label className="checkboxField">
            <input type="checkbox" name="isFeatured" />
            <span>Featured listing</span>
          </label>
          <label className="field listingAdminWide">
            <span>Kort beskrivning</span>
            <textarea name="shortDescription" rows={4} />
          </label>
          <button className="primaryButton" type="submit">
            Skapa annons
          </button>
        </form>
      </section>

      <section className="resultsPanel">
        <div className="resultsHeader">
          <h2>Befintliga annonser</h2>
          <p>Uppdatera pris, status, inflytt och lediga platser utan att lämna adminvyn.</p>
        </div>
        <div className="listingAdminList">
          {listings.map((listing) => (
            <article key={listing.id} className="listingAdminCard">
              <div className="listingAdminHeader">
                <div>
                  <div className="eyebrow">{listing.facilityVerified ? "Verified facility" : "Auto-listed facility"}</div>
                  <h3>{listing.title}</h3>
                  <p>
                    {listing.facilityName}, {listing.municipality}
                  </p>
                </div>
                <span className={`statusBadge ${listing.status === "active" ? "verified" : "listed"}`}>
                  {listing.status}
                </span>
              </div>

              <form action={saveListing} className="listingAdminForm">
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="facilityId" value={listing.facilityId} />
                <label className="field">
                  <span>Titel</span>
                  <input name="title" defaultValue={listing.title} required />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select name="status" defaultValue={listing.status}>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Boendeform</span>
                  <select name="boardingMode" defaultValue={listing.boardingMode}>
                    <option value="box">Box</option>
                    <option value="loose">Lösdrift</option>
                  </select>
                </label>
                <label className="field">
                  <span>Pris SEK/mån</span>
                  <input
                    type="number"
                    name="monthlyPriceSek"
                    min="0"
                    step="100"
                    defaultValue={listing.monthlyPriceSek}
                  />
                </label>
                <label className="field">
                  <span>Lediga platser</span>
                  <input
                    type="number"
                    name="openSpots"
                    min="0"
                    step="1"
                    defaultValue={listing.openSpots}
                  />
                </label>
                <label className="field">
                  <span>Inflytt från</span>
                  <input type="date" name="availableFrom" defaultValue={listing.availableFrom ?? ""} />
                </label>
                <label className="checkboxField">
                  <input type="checkbox" name="isFeatured" defaultChecked={listing.isFeatured} />
                  <span>Featured</span>
                </label>
                <label className="field listingAdminWide">
                  <span>Kort beskrivning</span>
                  <textarea name="shortDescription" rows={3} defaultValue={listing.shortDescription} />
                </label>
                <button className="primaryButton compactLink" type="submit">
                  Spara annons
                </button>
              </form>

              <div className="listingStatusActions">
                {statusOptions
                  .filter((status) => status !== listing.status)
                  .map((status) => (
                    <form key={status} action={changeListingStatus}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <input type="hidden" name="status" value={status} />
                      <button className="secondaryLink compactLink" type="submit">
                        Sätt {status}
                      </button>
                    </form>
                  ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
