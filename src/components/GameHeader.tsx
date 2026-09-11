import { useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { BriefcaseBusiness, Database, Gauge, Map, Warehouse, Wrench } from 'lucide-react';
import type { GameState } from '../domain/types';

export type SectionTab = 'garage' | 'jobs' | 'workshop' | 'saves';
const ITEMS = [
  { id: 'garage', label: 'Garage', Icon: Warehouse },
  { id: 'jobs', label: 'Jobs', Icon: BriefcaseBusiness },
  { id: 'city', label: 'City', Icon: Map },
  { id: 'races', label: 'Races', Icon: Gauge },
  { id: 'workshop', label: 'Workshop', Icon: Wrench },
  { id: 'saves', label: 'Saves', Icon: Database },
] as const;

export function GameHeader({ game, tab, hasStarted, jobReady, onTab }: {
  game: GameState; tab: SectionTab; hasStarted: boolean; jobReady: boolean; onTab: (tab: SectionTab) => void;
}) {
  const header = useRef<HTMLElement>(null);
  const disabled = (id: string) => id === 'city' || id === 'races' || (!hasStarted && (id === 'jobs' || id === 'workshop'));
  // Accurate focus/scroll offsets even when translated labels, zoom or mobile wrap the header.
  useLayoutEffect(() => {
    const element = header.current;
    if (!element) return;
    const resize = () => document.documentElement.style.setProperty('--game-header-height', `${element.getBoundingClientRect().height}px`);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--game-header-height'); };
  }, []);
  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const ids = ITEMS.filter((item) => !disabled(item.id)).map((item) => item.id);
    const index = ids.findIndex((id) => id === event.currentTarget.dataset.tab);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % ids.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + ids.length) % ids.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = ids.length - 1;
    else return;
    event.preventDefault();
    const id = ids[next] as SectionTab;
    onTab(id);
    const button = document.getElementById(`tab-${id}`);
    button?.focus({ preventScroll: true });
    button?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }
  return <header className="gameTopbar" ref={header}>
    <div className="gameHud">
      <div className="compactBrand"><div className="eyebrow">EAST WARD / UNDERGROUND</div><h1>KAGEHAMA<span className="brandDot">.</span></h1><span className="buildLabel">PRE-ALPHA / 05</span></div>
      <div className="playerMeta" aria-label="Player status">
        <div><span>CASH</span><strong data-testid="cash" title={`¥${game.cashYen.toLocaleString('en-US')}`}>¥{game.cashYen.toLocaleString('en-US')}</strong></div>
        <div><span>LEVEL</span><strong data-testid="player-level">{game.playerLevel.toLocaleString('en-US')}</strong></div>
        <div><span>REP</span><strong data-testid="reputation" title={game.reputation.toLocaleString('en-US')}>{game.reputation.toLocaleString('en-US')}</strong></div>
      </div>
    </div>
    <nav className="topNav" aria-label="Game navigation"><div className="sectionTabs" role="tablist" aria-label="Game sections">
      {ITEMS.map(({ id, label, Icon }) => <button type="button" key={id} id={`tab-${id}`} data-tab={id}
        role="tab" aria-label={label} aria-selected={id === tab} aria-controls={`panel-${id}`} disabled={disabled(id)}
        tabIndex={id === tab ? 0 : -1} onKeyDown={keyDown} onClick={() => onTab(id as SectionTab)}
        title={id === 'city' ? 'City arrives in Phase 7' : id === 'races' ? 'Racing arrives in Phase 6'
          : disabled(id) ? 'Choose a starter first' : label}>
        <Icon size={19} aria-hidden="true" /><span>{label}</span>
        {id === 'jobs' && jobReady && <b className="readyBadge" data-testid="job-ready-badge" aria-hidden="true">READY</b>}
        {(id === 'city' || id === 'races') && <small aria-hidden="true">SOON</small>}
      </button>)}
    </div></nav>
    <span className="srOnly" role="status">{jobReady ? 'Your job reward is ready to claim in Jobs.' : ''}</span>
  </header>;
}
