import { CITY_DISTRICTS, isDistrictFilter, type DistrictFilter as Filter } from '../data/city';

export function DistrictFilter({ value, kind, onChange }: {
  value: Filter; kind: 'Race' | 'Job'; onChange: (value: Filter) => void;
}) {
  return <div className="districtFilter">
    <label><span>{kind} district</span><select aria-label={`${kind} district`} value={value}
      onChange={(event) => { if (isDistrictFilter(event.target.value)) onChange(event.target.value); }}>
      <option value="all">All districts</option>
      {CITY_DISTRICTS.filter((district) => district.minLevel !== null).map((district) =>
        <option value={district.id} key={district.id}>{district.name}</option>)}
    </select></label>
    {value !== 'all' && <button type="button" className="secondaryButton" onClick={() => onChange('all')}>All {kind.toLowerCase()} districts</button>}
    <small>Browsing only · no travel cost. Pending activities stay visible regardless of filters.</small>
  </div>;
}
