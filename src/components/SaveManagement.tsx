import { useEffect, useState } from 'react';
import { Copy, Download, RotateCcw, Upload } from 'lucide-react';
import { exportSaveCode, importSaveCode, MAX_SAVE_LENGTH, SAVE_VERSION } from '../domain/persistence';
import { getActiveVehicle } from '../domain/garage';
import type { GameState } from '../domain/types';
export function SaveManagement({ game, blocked, onImport, onReset }: {
  game: GameState; blocked: boolean; onImport: (state: GameState) => boolean; onReset: () => boolean;
}) {
  const [saveCode, setSaveCode] = useState(''); const [importCode, setImportCode] = useState('');
  const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { setSaveCode(''); }, [game]);
  function generate() {
    try { setSaveCode(exportSaveCode(game)); setMessage('Save code generated.'); setError(''); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Export failed.'); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(saveCode); setMessage('Save code copied.'); }
    catch { setMessage('Clipboard unavailable. Select the code and copy it manually.'); }
  }
  function importCodeNow() {
    try {
      const { state } = importSaveCode(importCode);
      const job = state.economy.activeJob;
      const heatSummary = `\nHeat: ${state.heat.value}/100\nPatrol alert: ${state.heat.pendingStop ? `Run #${state.heat.pendingStop.raceRunId}, ¥${state.heat.pendingStop.fineYen} OR free Lay low` : 'None'}\nLay low: ${state.heat.cooldown ? 'Pending; original deadline retained' : 'None'}`;
      const market = state.market;
      const race = state.racing.activeRace;
      if (!window.confirm(`Import this save?\n\nCash: ¥${state.cashYen.toLocaleString('en-US')}\nLevel: ${state.playerLevel}\nVehicles: ${state.ownedVehicles.length}\nActive: ${getActiveVehicle(state)?.name ?? 'None'}\nMarket batch: ${market.generation + 1} (${market.listings.length} unsold listings)\nMarket trades: ${market.purchasedCount} bought / ${market.soldCount} sold\nPurchased parts: ${state.ownedVehicles.reduce((n, car) => n + car.tuning.purchasedPartIds.length, 0)}\nPending job: ${job ? `${job.jobId} (#${job.runId})` : 'None'}\nPending race: ${race ? `${race.eventName} (#${race.runId}), entry already paid` : 'None'}\nRace finishes: ${state.racing.completedRaces}${heatSummary}\n\nYour current save, including market stock/history, parts, race records and any pending job or race, will be replaced.`)) return;
      if (onImport(state)) { setImportCode(''); setSaveCode(''); setError(''); setMessage('Save imported and saved in this browser.'); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Import failed.'); }
  }
  function reset() {
    if (!window.confirm('Reset your entire KAGEHAMA save?\n\nHeat, patrol alerts and Lay low progress will also be cleared.\nCars, market stock/history, parts, money, progress, race records and any pending job or race will be reset. This cannot be undone unless you exported a save code first.')) return;
    if (onReset()) { setImportCode(''); setSaveCode(''); setError(''); setMessage('Save reset. Choose your new starter.'); }
  }
  return <section id="save-data" className="savePanel phase3SavePanel" aria-label="Save management">
    <div className="sectionTitle"><div><span>SAVE DATA · SCHEMA V{SAVE_VERSION}</span><h3>Save management</h3></div><p>Previous KAGEHAMA1 codes are still supported.</p></div>
    <div className="saveGrid">
      <article><div className="saveIcon"><Download /></div><h4>Export save</h4><p>Back up Heat, patrol alerts, cooldowns, cars, market stock, tuning, progress, race records and your pending activity, or move your save to another device.</p>
        <button type="button" className="secondaryButton" disabled={blocked} onClick={generate}>GENERATE SAVE CODE</button>
        {saveCode && <div className="codeBox"><textarea readOnly value={saveCode} aria-label="Exported save code" onFocus={(e) => e.target.select()} /><button type="button" onClick={copy}><Copy size={15} /> COPY</button></div>}
      </article>
      <article><div className="saveIcon"><Upload /></div><h4>Import save</h4><p>Codes are checked first. Confirm the preview to replace your current progress.</p>
        <textarea className="importBox" value={importCode} maxLength={MAX_SAVE_LENGTH} onChange={(e) => setImportCode(e.target.value)} placeholder="KAGEHAMA1-..." aria-label="Save code to import" />
        <button type="button" className="secondaryButton" disabled={!importCode.trim()} onClick={importCodeNow}>VALIDATE & IMPORT</button>
      </article>
      <article className="dangerCard"><div className="saveIcon"><RotateCcw /></div><h4>Reset savegame</h4><p>Back to ¥50,000 and three starter choices. Export a backup before resetting.</p>
        <button type="button" className="dangerButton" onClick={reset}>RESET SAVEGAME</button></article>
    </div>
    {message && <p className="saveFeedback" role="status">{message}</p>}{error && <div className="gameError" role="alert">{error}</div>}
    <p className="storageNote">Saved on this browser and device, not in a cloud account. Clearing site data deletes the local save. Keep an exported backup and use one game tab at a time.</p>
  </section>;
}
