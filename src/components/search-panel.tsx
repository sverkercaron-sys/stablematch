import { SearchFilters } from "@/lib/types";

type SearchPanelProps = {
  filters: SearchFilters;
};

export function SearchPanel({ filters }: SearchPanelProps) {
  return (
    <form className="searchPanel">
      <div className="searchRow">
        <label className="field">
          <span>Sök</span>
          <input name="q" defaultValue={filters.q} placeholder="Stall, kommun eller region" />
        </label>
        <label className="field">
          <span>Kommun</span>
          <input
            name="municipality"
            defaultValue={filters.municipality}
            placeholder="Till exempel Uppsala"
          />
        </label>
        <label className="field">
          <span>Län</span>
          <input name="region" defaultValue={filters.region} placeholder="Till exempel Uppsala län" />
        </label>
        <label className="field">
          <span>Typ</span>
          <select name="boardingMode" defaultValue={filters.boardingMode}>
            <option value="all">Alla</option>
            <option value="box">Box</option>
            <option value="loose">Lösdrift</option>
          </select>
        </label>
      </div>
      <div className="searchRow">
        <label className="field">
          <span>Maxpris SEK/mån</span>
          <input
            type="number"
            name="maxPrice"
            min="0"
            step="100"
            defaultValue={filters.maxPrice ?? ""}
            placeholder="5000"
          />
        </label>
        <label className="checkboxField">
          <input type="checkbox" name="ridingHouseOnly" defaultChecked={filters.ridingHouseOnly} />
          <span>Endast ridhus</span>
        </label>
        <label className="checkboxField">
          <input type="checkbox" name="paddockOnly" defaultChecked={filters.paddockOnly} />
          <span>Endast paddock</span>
        </label>
        <label className="checkboxField">
          <input type="checkbox" name="verifiedOnly" defaultChecked={filters.verifiedOnly} />
          <span>Endast verifierade</span>
        </label>
      </div>
      <div className="searchRow">
        <label className="checkboxField">
          <input
            type="checkbox"
            name="availableNowOnly"
            defaultChecked={filters.availableNowOnly}
          />
          <span>Endast lediga nu</span>
        </label>
        <div className="searchSpacer" />
        <div className="searchSpacer" />
        <button className="primaryButton" type="submit">
          Uppdatera sökning
        </button>
      </div>
    </form>
  );
}
