'use client';
import { useState } from 'react';
import type { StoryVideo } from './catalog';
import { videoBlocker } from './progression';
import css from './story.module.css';

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
}: {
  video: StoryVideo;
  completed: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const blocker = videoBlocker(video);
  const embed = allowedEmbed(video);
  return (
    <section className={css.panel} aria-labelledby="story-video-title">
      <p className={css.eyebrow}>Etapa obrigatória</p>
      <h2 id="story-video-title">Vídeo educativo</h2>
      <p>
        {completed
          ? 'Visualização registrada pelo servidor.'
          : (blocker ?? 'A visualização ainda precisa ser registrada.')}
      </p>
      {!blocker &&
        embed &&
        (opened ? (
          <iframe
            title={video.title}
            src={embed}
            allow="fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setOpened(true)}>
            Carregar vídeo de {video.provider}
          </button>
        ))}
      {!blocker && !embed && (
        <p>
          O player deste provedor aguarda integração. A conclusão permanece
          pendente.
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
      </p>
      <p className={css.meta}>
        Abrir o player não conclui esta etapa. Eventos de reprodução no
        navegador não são prova antifraude. A integração de verificação ainda
        está pendente.
      </p>
    </section>
  );
}
