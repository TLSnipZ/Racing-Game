// Branch-only integration helper. Removed before the verified release tree is published.
// Every replacement is anchored to the inspected Phase 6 source and must match once.
import { readFileSync, writeFileSync } from 'node:fs';
const pending = new Map();
function patch(path, before, after) {
  const source = pending.get(path) ?? readFileSync(path, 'utf8');
  if (source.split(before).length !== 2) throw new Error(`Expected one source anchor in ${path}: ${before.slice(0, 90)}`);
  pending.set(path, source.replace(before, after));
}
const app = 'src/App.tsx';
patch(app, "import { STARTER_CARS }", "import { getDistrictAccess } from './domain/city';\nimport type { DistrictFilter as CityFilter, DistrictId } from './data/city';\nimport type { RaceDiscipline } from './domain/racingTypes';\nimport { City } from './components/City';\nimport { STARTER_CARS }");
patch(app, "import './styles/phase6.css';", "import './styles/phase6.css';\nimport './styles/phase7.css';");
patch(app, "const [viewEpoch, setViewEpoch] = useState(0);", "const [viewEpoch, setViewEpoch] = useState(0);\n  const [raceDistrict, setRaceDistrict] = useState<CityFilter>('all');\n  const [jobDistrict, setJobDistrict] = useState<CityFilter>('all');\n  const [raceDiscipline, setRaceDiscipline] = useState<RaceDiscipline | 'all'>('all');");
patch(app, "next === 'workshop' || next === 'races'", "next === 'workshop' || next === 'races' || next === 'city'");
patch(app, "    setTab(next);\n  }", "    setTab(next);\n    document.getElementById(`tab-${next}`)?.focus({ preventScroll: true });\n  }\n  function openDistrict(section: 'jobs' | 'races', district: DistrictId) {\n    if (blocked || !getDistrictAccess(game, district).unlocked) return;\n    if (section === 'races') { setRaceDistrict(district); setRaceDiscipline('all'); }\n    else setJobDistrict(district);\n    selectTab(section);\n  }");
patch(app, "    setSelectedId(null); setViewEpoch", "    setRaceDistrict('all'); setJobDistrict('all'); setRaceDiscipline('all');\n    setSelectedId(null); setViewEpoch");
patch(app, 'className="shell phase3 phase4 phase5 phase6"', 'className="shell phase3 phase4 phase5 phase6 phase7"');
patch(app, '<Jobs key={viewEpoch} game={game} now={now} blocked={blocked}', '<Jobs key={viewEpoch} game={game} now={now} blocked={blocked} districtFilter={jobDistrict} onDistrictFilter={setJobDistrict}');
patch(app, '<Races key={viewEpoch} game={game} now={now} blocked={blocked}', '<Races key={viewEpoch} game={game} now={now} blocked={blocked}\n        districtFilter={raceDistrict} onDistrictFilter={setRaceDistrict} discipline={raceDiscipline} onDiscipline={setRaceDiscipline}');
patch(app, '<div id="panel-city" role="tabpanel" aria-labelledby="tab-city" hidden />', '<div id="panel-city" role="tabpanel" aria-labelledby="tab-city" tabIndex={0} hidden={tab !== \'city\'} className="sectionPanel">\n      {hasStarted && <City key={viewEpoch} game={game} blocked={blocked} jobReady={jobReady} raceReady={raceReady}\n        onRaces={(district) => openDistrict(\'races\', district)} onJobs={(district) => openDistrict(\'jobs\', district)}\n        onService={selectTab} onResume={selectTab} />}\n    </div>');
patch(app, 'PHASE 6 // RACING', 'PHASE 7 // KAGEHAMA CITY');

const header = 'src/components/GameHeader.tsx';
patch(header, "import type { GameState }", "import { HudLevelProgress } from './HudLevelProgress';\nimport type { GameState }");
patch(header, "'garage' | 'jobs' | 'races' | 'workshop' | 'saves'", "'garage' | 'jobs' | 'city' | 'races' | 'workshop' | 'saves'");
patch(header, "const disabled = (id: string) => id === 'city' || (!hasStarted && (id === 'jobs' || id === 'workshop' || id === 'races'));", "const disabled = (id: string) => !hasStarted && id !== 'garage' && id !== 'saves';");
patch(header, 'EAST WARD / UNDERGROUND', 'KAGEHAMA / UNDERGROUND');
patch(header, 'PRE-ALPHA / 06', 'PRE-ALPHA / 07');
patch(header, '<div><span>LEVEL</span><strong data-testid="player-level">{game.playerLevel.toLocaleString(\'en-US\')}</strong></div>', '<div className="hudLevel"><span>LEVEL</span><strong data-testid="player-level">{game.playerLevel.toLocaleString(\'en-US\')}</strong>\n          <HudLevelProgress reputation={game.reputation} playerLevel={game.playerLevel} /></div>');
patch(header, "title={id === 'city' ? 'City arrives in Phase 7' : disabled(id) ? 'Choose a starter first' : label}", "title={disabled(id) ? 'Choose a starter first' : label}");
patch(header, "        {id === 'city' && <small aria-hidden=\"true\">SOON</small>}\n", '');

const races = 'src/components/Races.tsx';
patch(races, "import { DISCIPLINE_LABELS, findRaceEvent, RACE_EVENTS }", "import { DistrictFilter } from './DistrictFilter';\nimport type { DistrictFilter as CityFilter } from '../data/city';\nimport { getDistrictRaces } from '../domain/city';\nimport { DISCIPLINE_LABELS, findRaceEvent }");
patch(races, 'export function Races({ game, now, blocked, onStart, onSettle, onCancel }: {', 'export function Races({ game, now, blocked, onStart, onSettle, onCancel, districtFilter, onDistrictFilter, discipline, onDiscipline }: {\n  districtFilter: CityFilter; onDistrictFilter: (value: CityFilter) => void;\n  discipline: RaceDiscipline | \'all\'; onDiscipline: (value: RaceDiscipline | \'all\') => void;');
patch(races, "  const [discipline, setDiscipline] = useState<RaceDiscipline | 'all'>('all');", '  const setDiscipline = onDiscipline;');
patch(races, '<div className="categoryChips" role="group" aria-label="Filter races by discipline">', '<DistrictFilter kind="Race" value={districtFilter} onChange={onDistrictFilter} />\n    <div className="categoryChips" role="group" aria-label="Filter races by discipline">');
patch(races, 'All events <b>{RACE_EVENTS.length}</b>', 'All events <b>{getDistrictRaces(districtFilter).length}</b>');
patch(races, 'RACE_EVENTS.filter((e) => e.discipline === d).length', 'getDistrictRaces(districtFilter, d).length');
patch(races, "RACE_EVENTS.filter((e) => discipline === 'all' || e.discipline === discipline)", 'getDistrictRaces(districtFilter, discipline)');
patch(races, '    })}</div>\n    {reviewError', '    })}</div>\n    {getDistrictRaces(districtFilter, discipline).length === 0 && <p className="districtEmpty" role="status">No events match these district and discipline filters.\n      <button type="button" className="secondaryButton" onClick={() => { onDistrictFilter(\'all\'); onDiscipline(\'all\'); }}>Clear race filters</button></p>}\n    {reviewError');

const jobs = 'src/components/Jobs.tsx';
patch(jobs, "import { findJob, JOBS }", "import { DistrictFilter } from './DistrictFilter';\nimport type { DistrictFilter as CityFilter } from '../data/city';\nimport { getDistrictJobs } from '../domain/city';\nimport { findJob, JOBS }");
patch(jobs, 'export function Jobs({ game, now, blocked, onStart, onClaim, onCancel }: {', 'export function Jobs({ game, now, blocked, onStart, onClaim, onCancel, districtFilter, onDistrictFilter }: {\n  districtFilter: CityFilter; onDistrictFilter: (value: CityFilter) => void;');
patch(jobs, '<div className="jobGrid">{JOBS.map((job) => {', '<DistrictFilter kind="Job" value={districtFilter} onChange={onDistrictFilter} />\n    <div className="jobGrid">{getDistrictJobs(districtFilter).map((job) => {');
patch(jobs, '    })}</div>\n    <p className="jobNote">All three', '    })}</div>\n    {getDistrictJobs(districtFilter).length === 0 && <p className="districtEmpty" role="status">No job contacts in this district yet. Select All job districts to see current offers.</p>}\n    <p className="jobNote">All three');

const tests = 'tests/e2e/interface-tuning.spec.ts';
patch(tests, "['Jobs', 'Races', 'Workshop', 'Saves', 'Garage']", "['Jobs', 'City', 'Races', 'Workshop', 'Saves', 'Garage']");
patch(tests, "getByRole('tab', { name: 'City', exact: true })).toBeDisabled()", "getByRole('tab', { name: 'City', exact: true })).toBeEnabled()");
patch(tests, "  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Races', exact: true })).toBeFocused();", "  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'City', exact: true })).toBeFocused();\n  await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-city');\n  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Races', exact: true })).toBeFocused();");
patch('tests/e2e/helpers.ts', "'Garage' | 'Jobs' |", "'Garage' | 'Jobs' | 'City' |");
for (const [path, content] of pending) { writeFileSync(path, content); console.log(`Integrated ${path}`); }
