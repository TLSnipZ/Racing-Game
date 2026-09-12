import { heatStatus } from '../domain/heatRules';
export function HeatBadge({ value, disabled, onOpen }: { value: number; disabled: boolean; onOpen: () => void }) {
  return <button className={`hudHeat heat-${heatStatus(value).toLowerCase()}`} type="button" onClick={onOpen} disabled={disabled} aria-label="Open Heat controls" title="Police attention · open recovery in City">
    <span>HEAT <b data-testid="heat-value">{value}/100</b> · {heatStatus(value)}</span>
    <progress aria-label="HUD Heat" max={100} value={value} />
  </button>;
}
