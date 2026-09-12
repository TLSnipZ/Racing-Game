import { useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { BookOpen, BriefcaseBusiness, Database, Gauge, Map, Store, Warehouse, Wrench } from 'lucide-react';
import { getClaimableAchievements } from '../domain/collectionProgress';
import { HeatBadge } from './HeatBadge';
import { HudLevelProgress } from './HudLevelProgress';
import type { GameState } from '../domain/types';

export type SectionTab = 'garage' | 'jobs' | 'city' | 'races' | 'workshop' | 'market' | 'collection' | 'saves';
const ITEMS = [
  { id: 'garage', label: 'Garage', Icon: Warehouse },
  { id: 'jobs', label: 'Jobs', Icon: BriefcaseBusiness },
  { id: 'city', label: 'City', Icon: Map },
  { id: 'races', label: 'Races', Icon: Gauge },
  { id: 'workshop', label: 'Workshop', Icon: Wrench },
  { id: 'market', label: 'Market', Icon: Store },
  { id: 'collection', label: 'Collection', Icon: BookOpen },
  { id: 'saves', label: 'Saves', Icon: Database },
] as const;
export function GameHeader({ game, tab, hasStarted, jobReady, raceReady, heatReady, onHeat, onTab }: {
  heatReady: boolean; onHeat: () => void;
  game: GameState; tab: SectionTab; hasStarted: boolean; jobReady: boolean; raceReady: boolean; onTab: (tab: SectionTab) => void;
}) {
  const header = useRef<HTMLElement>(null);
  const rewardsReady = getClaimableAchievements(game).length;
  const disabled = (id: string) => !hasStarted && id !== 'garage' && id !== 'saves';
  useLayoutEffect(() => {
    const element = header.current;
    if (!element) return;
    const resize = () => document.documentElement.style.setProperty('--game-header-height', `${element.getBoundingClientRect().height}px`);
    resize(); const observer = new ResizeObserver(resize); observer.observe(element);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--game-header-height'); };
  }, []);
  // Programmatic section shortcuts must also reveal the selected tab on narrow screens.
  // Move only the navigation row, never the document's vertical scroll position.
  useLayoutEffect(() => {
    const button = header.current?.querySelector<HTMLElement>(`#tab-${tab}`);
    const row = button?.parentElement;
    if (!button || !row) return;
    const target = button.getBoundingClientRect(); const viewport = row.getBoundingClientRect();
    if (target.left < viewport.left) row.scrollLeft -= viewport.left - target.left;
    else if (target.right > viewport.right) row.scrollLeft += target.right - viewport.right;
  }, [tab]);
  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const ids = ITEMS.filter((item) => !disabled(item.id)).map((item) => item.id);
    const index = ids.findIndex((id) => id === event.currentTarget.dataset.tab);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % ids.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + ids.length) % ids.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = ids.length - 1;
    else return;
    event.preventDefault(); const id = ids[next] as SectionTab; onTab(id);
    const button = document.getElementById(`tab-${id}`); button?.focus({ preventScroll: true });
    button?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }
  return <header className="gameTopbar" ref={header}>
    <div className="gameHud"><div className="compactBrand"><div className="eyebrow">KAGEHAMA / UNDERGROUND</div>
      <h1>KAGEHAMA<span className="brandDot">.</span></h1><span className="buildLabel">PRE-ALPHA / 10</span><HeatBadge value={game.heat.value} disabled={!hasStarted} onOpen={onHeat} /></div>
      <div className="playerMeta" aria-label="Player status"><div><span>CASH</span><strong data-testid="cash" title={`¥${game.cashYen.toLocaleString('en-US')}`}>¥{game.cashYen.toLocaleString('en-US')}</strong></div>
        <div className="hudLevel"><span>LEVEL</span><strong data-testid="player-level">{game.playerLevel.toLocaleString('en-US')}</strong>
          <HudLevelProgress reputation={game.reputation} playerLevel={game.playerLevel} /></div>
        <div><span>REP</span><strong data-testid="reputation" title={game.reputation.toLocaleString('en-US')}>{game.reputation.toLocaleString('en-US')}</strong></div></div>
    </div>
    <nav className="topNav" aria-label="Game navigation"><div className="sectionTabs" role="tablist" aria-label="Game sections">
      {ITEMS.map(({ id, label, Icon }) => <button type="button" key={id} id={`tab-${id}`} data-tab={id} role="tab" aria-label={label}
        aria-selected={id === tab} aria-controls={`panel-${id}`} disabled={disabled(id)} tabIndex={id === tab ? 0 : -1}
        onKeyDown={keyDown} onClick={() => onTab(id as SectionTab)} title={disabled(id) ? 'Choose a starter first' : label}>
        <Icon size={19} aria-hidden="true" /><span>{label}</span>
        {id === 'collection' && rewardsReady > 0 && <b className="readyBadge" data-testid="collection-ready-badge" aria-hidden="true">{rewardsReady}</b>}
        {id === 'city' && (game.heat.pendingStop || game.heat.cooldown) && <b className="readyBadge" data-testid="heat-ready-badge" aria-hidden="true">{heatReady ? 'READY' : game.heat.cooldown ? 'PAUSE' : 'ALERT'}</b>}
        {id === 'jobs' && jobReady && <b className="readyBadge" data-testid="job-ready-badge" aria-hidden="true">READY</b>}
        {id === 'races' && raceReady && <b className="readyBadge" data-testid="race-ready-badge" aria-hidden="true">READY</b>}
      </button>)}
    </div></nav>
    <span className="srOnly" role="status">{heatReady ? 'Lay low is ready to finish in City.' : game.heat.pendingStop && !game.heat.cooldown ? 'A patrol alert needs your decision in City.' : jobReady ? 'Your job reward is ready to claim in Jobs.' : raceReady ? 'Your race result is ready to settle in Races.' : rewardsReady ? `${rewardsReady} achievement rewards are ready in Collection.` : ''}</span>
  </header>;
}
