import { useId } from 'react';

/** Cenário decorativo original, FICTIONAL: não é reconstrução do Éden. */
export function Landscape({ className = '' }: { className?: string }) {
  const id = useId().replaceAll(':', '');
  return (
    <svg
      className={className}
      viewBox="0 0 1000 760"
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id={`${id}-sky`}
          x2="0"
          y2="760"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#b8c4a5" />
          <stop offset=".5" stopColor="#eed7a0" />
          <stop offset="1" stopColor="#8caa7e" />
        </linearGradient>
        <linearGradient
          id={`${id}-river`}
          x1="600"
          y1="360"
          x2="440"
          y2="760"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d7d5a2" />
          <stop offset="1" stopColor="#679991" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor="#fff2c3" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff2c3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path fill={`url(#${id}-sky)`} d="M0 0h1000v760H0z" />
      <circle cx="650" cy="235" r="240" fill={`url(#${id}-light)`} />
      <circle cx="650" cy="235" r="57" fill="#f9e9b9" />
      <path
        d="M0 319 151 178 294 325 408 239 574 360 800 238 1000 302V760H0Z"
        fill="#a3ae91"
      />
      <path
        d="m0 394 189-91 148 84 175-113 187 132 192-111 109 27v438H0Z"
        fill="#80977e"
      />
      <path d="M0 432Q180 328 344 438T637 427T1000 392V760H0Z" fill="#617e69" />
      <path d="M0 544Q160 412 365 506T681 466T1000 481V760H0Z" fill="#3b6254" />
      <path
        d="M634 403c-92 80-113 67-85 119s-89 68-92 103 189 61 241 135H286c-33-113 97-125 142-154s-7-64 65-102 57-57 141-101"
        fill={`url(#${id}-river)`}
      />
      <path d="M0 646Q160 550 371 635l-31 125H0Z" fill="#2b4b3d" />
      <path d="M1000 567Q832 506 684 643l86 117h230Z" fill="#284c40" />
      <path
        d="M46 760c176-133 97-132 224-172 60-20 78-28 105-51-7 40-100 59-90 90 7 30 4 55-23 133"
        fill="#b6a277"
      />
      <path
        d="M221 760c46-91 20-111 4-128"
        stroke="#d0bd8c"
        strokeWidth="4"
        strokeDasharray="3 13"
      />
      {[
        { x: 100, y: 492, s: 1.4 },
        { x: 876, y: 485, s: 1.6 },
        { x: 791, y: 570, s: 0.8 },
        { x: 330, y: 486, s: 0.6 },
        { x: 52, y: 622, s: 1.2 },
      ].map(({ x, y, s }) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M-5 45 0-110 9 45Z" fill="#293b2c" />
          <path
            d="m0-173-61 78h27l-45 65h45l-34 51H70L40-30h39L33-95h26Z"
            fill="#244c3e"
          />
          <path d="m0-173-38 78h23l-27 65H0Z" fill="#3b6247" />
        </g>
      ))}
      <g fill="#6f885c">
        <path d="m0 760 25-85 18 33 20-63 14 84 26-46 20 77Z" />
        <path d="m786 760 40-74 14 25 38-90 9 80 22-29 18 88Z" />
      </g>
      <g fill="#ead495">
        <path d="M155 572h5v5h-5zM380 619h4v4h-4zM760 494h5v5h-5zM710 573h4v4h-4zM826 629h5v5h-5z" />
      </g>
      <path
        d="m492 190 10-5 10 5m21 12 7-4 8 4"
        stroke="#607868"
        strokeWidth="2"
      />
    </svg>
  );
}
