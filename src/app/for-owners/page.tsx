import { submitClaim } from "@/app/actions";
import { getFacilities } from "@/lib/facilities";

type OwnersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnersPage({ searchParams }: OwnersPageProps) {
  const params = (await searchParams) ?? {};
  const selectedFacilityId = Array.isArray(params.facility) ? params.facility[0] : params.facility;
  const facilities = await getFacilities();

  return (
    <div className="pageStack">
      <section className="hero compact">
        <div className="heroContent">
          <div className="eyebrow">Claim flow</div>
          <h1>För stallägare</h1>
          <p>
            Claim-flödet är centralt för StableMatch. Auto-listade profiler ger bredd, verifierade
            profiler ger kvalitet och konvertering.
          </p>
        </div>
      </section>

      <section className="detailGrid">
        <article className="detailCard">
          <h2>Så fungerar nivåerna</h2>
          <div className="detailList">
            <div>
              <span>Nivå 1</span>
              <strong>Auto-listat stall</strong>
            </div>
            <div>
              <span>Nivå 2</span>
              <strong>Verifierad stallprofil</strong>
            </div>
          </div>
          <p>
            Verifierade stall ska senare kunna uppdatera pris, faciliteter, bilder, öppna platser
            och inkomna intresseanmälningar.
          </p>
        </article>

        <article className="detailCard">
          <h2>Gör anspråk på profil</h2>
          <form action={submitClaim} className="stackedForm">
            <label className="field">
              <span>Välj stall</span>
              <select name="facilityId" defaultValue={selectedFacilityId ?? ""} required>
                <option value="" disabled>
                  Välj en profil
                </option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name} ({facility.municipality})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Ditt namn</span>
              <input name="claimantName" required />
            </label>
            <label className="field">
              <span>E-post</span>
              <input name="email" type="email" required />
            </label>
            <label className="field">
              <span>Telefon</span>
              <input name="phone" />
            </label>
            <label className="field">
              <span>Roll</span>
              <input name="role" placeholder="Ägare, verksamhetsansvarig, manager" />
            </label>
            <label className="field">
              <span>Kommentar</span>
              <textarea
                name="note"
                rows={5}
                placeholder="Beskriv kort varför du ska ha tillgång till profilen."
              />
            </label>
            <button className="primaryButton" type="submit">
              Skicka claim-begäran
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
