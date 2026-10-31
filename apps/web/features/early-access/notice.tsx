import styles from './notice.module.css';

export function EarlyAccessNotice() {
  return (
    <details className={styles.notice}>
      <summary>RPG Jovem Cristão — Acesso Antecipado</summary>
      <p>
        Crie ou selecione seu avatar e explore o RPG. Você pode consultar a
        Jornada, a Mochila, a Coleção e o Diário, experimentar Missões e jogar
        Fuga da Serpente. Não é preciso pertencer a uma Guilda para começar.
      </p>
      <p>
        Com um convite válido, participe de uma Guilda e das classes, aulas,
        encontros, atividades e gincanas disponíveis à sua conta. Líderes e
        professores precisam de autorização para administrar sua comunidade.
      </p>
      <p>
        Missões demonstrativas e minigames não salvam progresso oficial nem
        concedem recompensas. Resultados pedagógicos e presenças da comunidade
        são registros próprios, separados da progressão da história.
      </p>
      <p>
        Equipamentos, Loja, Arena, Torre, chat, eventos entre Guildas e novas
        recompensas estão indisponíveis. Algumas funcionalidades continuam em
        desenvolvimento; não há promessa de recompensas retroativas pelas
        atividades desta versão.
      </p>
    </details>
  );
}
