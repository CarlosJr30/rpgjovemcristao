'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { StoryVideo } from './catalog';
import { videoBlocker } from './progression';
import css from './story.module.css';
import { useMusicHold } from '../journey/hooks/use-game-audio';
import { gameAudio } from '../journey/audio/audio-manager';

function safeMediaUrl(value: string | null) {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
function ApprovedNativeVideo({
  video,
  onClose,
}: {
  video: StoryVideo;
  onClose: () => void;
}) {
  const [playing, setPlaying] = useState(false),
    [observed, setObserved] = useState(false),
    [failed, setFailed] = useState<'playback' | 'captions'>();
  const preferences = useSyncExternalStore(
    gameAudio.subscribe,
    gameAudio.getSnapshot,
    gameAudio.getServerSnapshot,
  );
  const player = useRef<HTMLVideoElement>(null);
  useMusicHold(playing && !failed);
  useEffect(() => {
    if (player.current) {
      player.current.muted = preferences.muted;
      player.current.volume = preferences.masterVolume;
    }
  }, [preferences.muted, preferences.masterVolume]);
  const fail = useCallback((reason: 'playback' | 'captions') => {
    setFailed(reason);
    setPlaying(false);
    setObserved(false);
  }, []);
  const attachCaptionTrack = useCallback(
    (track: HTMLTrackElement | null) => {
      if (!track) return;
      const onError = () => fail('captions');
      track.addEventListener('error', onError);
      return () => track.removeEventListener('error', onError);
    },
    [fail],
  );
  return (
    <div>
      <button onClick={onClose}>Fechar vídeo e retomar ambiente</button>
      {failed ? (
        <>
          <p role="alert">
            {failed === 'captions'
              ? 'Não foi possível carregar as legendas.'
              : 'Não foi possível reproduzir o vídeo.'}{' '}
            A etapa continua pendente; tente novamente quando a conexão ou a
            fonte estiver disponível.
          </p>
          <button type="button" onClick={() => setFailed(undefined)}>
            Tentar carregar vídeo novamente
          </button>
        </>
      ) : (
        <video
          aria-label={video.title}
          crossOrigin="anonymous"
          ref={player}
          controls
          playsInline
          preload="metadata"
          muted={preferences.muted}
          src={safeMediaUrl(video.url)!}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => fail('playback')}
          onEnded={(event) => {
            setPlaying(false);
            const target = event.currentTarget;
            if (
              target.ended &&
              Number.isFinite(target.duration) &&
              target.duration > 0 &&
              target.currentTime >= target.duration - 0.5
            )
              setObserved(true);
          }}
          onVolumeChange={(event) => {
            if (preferences.muted) event.currentTarget.muted = true;
          }}
        >
          <track
            ref={attachCaptionTrack}
            kind="captions"
            src={safeMediaUrl(video.captionUrl)!}
            srcLang={video.language}
            label={video.captions!}
            default
          />
        </video>
      )}
      <p role="status">
        {observed
          ? 'Término observado neste player. A confirmação oficial continua pendente do servidor.'
          : 'Abrir ou iniciar o vídeo não conclui a etapa.'}
      </p>
      <p className={css.meta}>
        Observação local de reprodução, sem recibo oficial e sem recompensa. A
        música ambiente pausa durante a reprodução e retoma ao pausar, encerrar
        ou fechar.
      </p>
    </div>
  );
}

export function allowedEmbed(video: StoryVideo): string | null {
  if (videoBlocker(video)) return null;
  if (
    video.provider === 'youtube' &&
    /^[\w-]{11}$/.test(video.externalId ?? '')
  )
    return `https://www.youtube-nocookie.com/embed/${video.externalId}`;
  if (video.provider === 'vimeo' && /^\d{1,12}$/.test(video.externalId ?? ''))
    return `https://player.vimeo.com/video/${video.externalId}`;
  return null;
}
export function StoryVideoPanel({
  video,
  completed,
  publication,
}: {
  video: StoryVideo;
  completed: boolean;
  // O catálogo legado usa a validação existente. A demo exige vínculo explícito.
  publication?: { revision: number; videoId: string } | null;
}) {
  const [opened, setOpened] = useState(false);
  const validPublication =
    publication === undefined ||
    (publication !== null &&
      Number.isInteger(publication.revision) &&
      publication.revision > 0 &&
      !!publication.videoId.trim() &&
      publication.videoId === video.externalId);
  const blocker =
    videoBlocker(video) ??
    (validPublication
      ? null
      : 'Aguardando vínculo do vídeo à revisão publicada.');
  const native =
    video.provider === 'html5' &&
    !!safeMediaUrl(video.url) &&
    !!safeMediaUrl(video.captionUrl);
  return (
    <section className={css.panel} aria-labelledby="story-video-title">
      <p className={css.eyebrow}>Etapa obrigatória</p>
      <h2 id="story-video-title" tabIndex={-1}>
        Vídeo educativo
      </h2>
      <p>
        {completed
          ? 'Visualização registrada pelo servidor.'
          : (blocker ?? 'A visualização ainda precisa ser registrada.')}
      </p>
      {!blocker &&
        native &&
        (opened ? (
          <ApprovedNativeVideo video={video} onClose={() => setOpened(false)} />
        ) : (
          <button onClick={() => setOpened(true)}>
            Carregar vídeo de {video.provider}
          </button>
        ))}
      {!blocker && !native && (
        <p>
          {video.provider === 'html5'
            ? 'A fonte do vídeo ou das legendas está indisponível.'
            : 'O player deste provedor aguarda integração de sua API de término.'}{' '}
          A conclusão permanece pendente.
        </p>
      )}
      <p className={css.meta}>
        Idioma: {video.language} · Duração:{' '}
        {video.durationSeconds ? `${video.durationSeconds} s` : 'a confirmar'}
        <br />
        Fonte: {video.source ?? 'em seleção'} · Autoria:{' '}
        {video.author ?? 'a confirmar'}
        <br />
        Autorização:{' '}
        {video.authorization.status === 'approved'
          ? video.authorization.terms
          : 'pendente'}
        <br />
        Legendas: {video.captions ?? 'a confirmar'} · Alternativa acessível:{' '}
        {video.accessibleAlternative ?? 'a definir com a seleção do vídeo'}
        <br />
        Incorporação:{' '}
        {video.embedding === 'allowed'
          ? 'autorizada'
          : video.embedding === 'denied'
            ? 'não autorizada'
            : 'pendente'}{' '}
        · Revisão editorial:{' '}
        {video.editorialReview.status === 'approved' ? 'aprovada' : 'pendente'}
      </p>
      <p className={css.meta}>
        Abrir o player não conclui esta etapa. Eventos de reprodução no
        navegador não são prova antifraude. A integração de verificação ainda
        está pendente.
      </p>
    </section>
  );
}
