'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArchiveSnapshot } from '../../lib/supabase/online-sync';
import { useStoryProgress } from './use-story-progress';
import { ArchiveAccess } from '../release-ebd/archive';
import { AvatarRuntime } from '../journey/components/avatar-runtime';
import type { Point } from './creation-explorer-model';
import { CREATION_DAYS, movePoint, pointIsNear } from './creation-explorer-model';
import css from './creation-explorer.module.css';

type Scene = 'sanctuary' | 'day-one';
const PORTAL: Point = { x: 78, y: 50 };
const MARKER: Point = { x: 72, y: 50 };
const START: Point = { x: 22, y: 52 };
const INITIAL: Point = { x: 18, y: 50 };

export function CreationExplorerScreen() {
  return <ArchiveAccess>{(snapshot) => <AuthenticatedExplorer snapshot={snapshot} />}</ArchiveAccess>;
}

function AuthenticatedExplorer({ snapshot }: { snapshot: ArchiveSnapshot }) {
  const progress = useStoryProgress(snapshot.traveler.id);
  const saved = progress.records?.find((record) => record.story_id === 'creation');
  return <CreationExplorerView traveler={snapshot.traveler} canonicalSteps={saved?.completed_steps ?? []} />;
}

export function CreationExplorerView({
  traveler,
  canonicalSteps = [],
}: {
  traveler: ArchiveSnapshot['traveler'];
  canonicalSteps?: readonly string[];
}) {
  const [scene, setScene] = useState<Scene>('sanctuary');
  const [position, setPosition] = useState<Point>(INITIAL);
  const [message, setMessage] = useState('Explore o santuário e interaja com o portal.');
  const [answer, setAnswer] = useState('');
  const [demoComplete, setDemoComplete] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  const moveTo = useCallback((point: Point) => setPosition((current) => movePoint(current, point)), []);
  const interact = useCallback(() => {
    if (scene === 'sanctuary' && pointIsNear(position, PORTAL)) {
      setScene('day-one'); setPosition(START); setMessage('Dia 1 — Luz e trevas. Encontre o marco para abrir o desafio.');
    } else if (scene === 'day-one' && pointIsNear(position, MARKER)) {
      setMessage('Associe a referência Gênesis 1:3–5 ao tema apresentado.');
    } else if (scene === 'day-one' && pointIsNear(position, { x: 18, y: 52 })) {
      setScene('sanctuary'); setPosition(INITIAL); setMessage('Você voltou ao Santuário da Jornada.');
    } else {
      setMessage('Aproxime-se de um ponto de interação para continuar.');
    }
  }, [position, scene]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const delta = key === 'arrowup' || key === 'w' ? { x: 0, y: -5 }
        : key === 'arrowdown' || key === 's' ? { x: 0, y: 5 }
        : key === 'arrowleft' || key === 'a' ? { x: -5, y: 0 }
        : key === 'arrowright' || key === 'd' ? { x: 5, y: 0 } : null;
      if (delta) {
        if (event.target instanceof Element && event.target.closest('button, a, input')) return;
        event.preventDefault(); moveTo({ x: position.x + delta.x, y: position.y + delta.y });
      }
      if (key === 'e' || key === 'enter') {
        if (event.target instanceof Element && event.target.closest('button, a, input')) return;
        interact();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [interact, moveTo, position]);

  function handleFloorClick(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return;
    const rect = stage.current?.getBoundingClientRect();
    if (!rect) return;
    moveTo({ x: (event.clientX - rect.left) / rect.width * 100, y: (event.clientY - rect.top) / rect.height * 100 });
  }

  function submitAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (answer === 'Luz e trevas') {
      setDemoComplete(true); setMessage('Resposta demonstrativa correta. A conclusão não foi salva como progresso oficial.');
    } else setMessage('Tente novamente. Esta atividade demonstrativa não aplica penalidade.');
  }

  return (
    <main className={css.page}>
      <Link className={css.back} href="/journey/stories/creation">← Voltar à história</Link>
      <header className={css.header}>
        <p className={css.eyebrow}>Protótipo jogável · progresso oficial somente leitura</p>
        <h1>Santuário da Jornada</h1>
        <p>Espaço fictício do jogo, criado como entrada para os mundos bíblicos.</p>
      </header>
      <div className={css.notice} role="note">
        Demonstração temporária: posição e respostas podem ser perdidas ao atualizar a página. Nenhuma conclusão é salva nem há concessão de recompensas.
        {canonicalSteps.length > 0 && <span> Registros canônicos consultados: {canonicalSteps.length} etapa(s).</span>}
      </div>
      <div className={css.layout}>
        <section className={css.playArea} aria-label="Exploração">
          <div className={`${css.stage} ${scene === 'day-one' ? css.dayScene : ''}`} ref={stage} onClick={handleFloorClick}>
            <div className={css.horizon} aria-hidden="true" />
            {scene === 'sanctuary' ? <>
              <p className={css.sceneTitle}>Santuário fictício</p>
              <div className={css.symbols} aria-label="Sete símbolos da Criação">
                {CREATION_DAYS.map((day, i) => <span key={day} className={i === 0 ? css.symbolActive : css.symbol}>{i + 1} · {day}</span>)}
              </div>
              <button className={`${css.poi} ${css.portal}`} style={{ left: `${PORTAL.x}%`, top: `${PORTAL.y}%` }} onClick={(e) => { e.stopPropagation(); interact(); }} aria-label="Interagir com o portal para Dia 1">◉<span>Portal · Dia 1</span></button>
            </> : <>
              <p className={css.sceneTitle}>Dia 1 — Luz e trevas</p>
              <div className={css.light} aria-hidden="true" />
              <button className={`${css.poi} ${css.marker}`} style={{ left: `${MARKER.x}%`, top: `${MARKER.y}%` }} onClick={(e) => { e.stopPropagation(); moveTo(MARKER); setMessage('Marco do Dia 1 selecionado. Use Interagir para abrir o desafio.'); }} aria-label="Marco de interação do Dia 1">✦<span>Marco da luz</span></button>
              <button className={`${css.poi} ${css.exit}`} style={{ left: '18%', top: '52%' }} onClick={(e) => { e.stopPropagation(); setScene('sanctuary'); setPosition(INITIAL); setMessage('Você voltou ao Santuário da Jornada.'); }} aria-label="Voltar ao Santuário">↩<span>Retornar</span></button>
            </>}
            <div className={css.barrier} aria-hidden="true" />
            <div data-testid="traveler-position" className={css.avatar} style={{ left: `${position.x}%`, top: `${position.y}%` }}><AvatarRuntime traveler={traveler} mode="thumbnail" label={`Viajante ${traveler.name}`} /></div>
          </div>
          <p className={css.controls}>Mover: WASD ou setas · Clique/toque no terreno livre · Interagir: E ou Enter</p>
          <div className={css.actions}>
            <button onClick={interact}>Interagir</button>
            {scene === 'day-one' && <button onClick={() => { setScene('sanctuary'); setPosition(INITIAL); setMessage('Você voltou ao Santuário da Jornada.'); }}>Voltar ao Santuário</button>}
            <Link href="/journey/diary">Abrir Diário Bíblico</Link>
          </div>
        </section>
        <aside className={css.panel}>
          <h2>Painel de objetivos</h2>
          <p><strong>Agora:</strong> {message}</p>
          <p>{scene === 'day-one' ? 'Referência: Gênesis 1:3–5.' : 'Objetivo: explorar o cenário e acessar o primeiro dia.'}</p>
          {scene === 'day-one' && (
            <form onSubmit={submitAnswer}>
              <fieldset>
                <legend>Desafio demonstrativo: qual tema aparece nesta referência?</legend>
                <label><input type="radio" name="creation-answer" value="Luz e trevas" checked={answer === 'Luz e trevas'} onChange={(e) => setAnswer(e.target.value)} /> Luz e trevas</label>
                <label><input type="radio" name="creation-answer" value="Firmamento" checked={answer === 'Firmamento'} onChange={(e) => setAnswer(e.target.value)} /> Firmamento</label>
                <button type="submit">Conferir resposta</button>
              </fieldset>
              {demoComplete && <p role="status">Atividade demonstrativa concluída nesta sessão.</p>}
            </form>
          )}
          <p className={css.pending}>Atividade demonstrativa; conteúdo aguardando revisão editorial. Não representa conclusão canônica.</p>
          <h3>Navegação acessível</h3>
          <ul className={css.poiList}>
            {scene === 'sanctuary' ? <li><button onClick={() => { setScene('day-one'); setPosition(START); setMessage('Dia 1 — Luz e trevas. Encontre o marco para abrir o desafio.'); }}>Entrar no Dia 1 pelo portal</button></li> : <>
              <li><button onClick={() => { setPosition(MARKER); setMessage('Marco do Dia 1 selecionado. Use Interagir para abrir o desafio.'); }}>Selecionar marco da luz</button></li>
              <li><button onClick={() => { setScene('sanctuary'); setPosition(INITIAL); setMessage('Você voltou ao Santuário da Jornada.'); }}>Retornar ao Santuário</button></li>
            </>}
          </ul>
          <p className={css.srStatus} role="status" aria-live="polite">{message}</p>
        </aside>
      </div>
    </main>
  );
}
