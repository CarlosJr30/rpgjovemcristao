# Áudios de protótipo — somente desenvolvimento local

Os oito OGG deste diretório foram relocados de `apps/web/public/assets/audio`, sem mudar bytes, hashes, licença ou aprovação. Continuam `SUNO_FREE_NON_COMMERCIAL`, `APPROVED_FOR_PROTOTYPE` e `commercialProductionApproved=false` nas receipts originais.

`npm run dev` inicia um servidor auxiliar somente em loopback. O Next em desenvolvimento encaminha as URLs existentes para esse servidor, que aceita somente os oito arquivos registrados e confere seus hashes. Não são criadas cópias em `public`.

`npm run build` e `npm run start` não iniciam esse servidor. A configuração de produção não registra o encaminhamento DEV e exclui estas fontes das traces de deploy. Os gates de mídia bloqueiam arquivos restritos em diretórios públicos/artefatos, inclusive cópias renomeadas. Não copiar estas fontes para `public`, `.next/static`, `.vercel/output` ou outros diretórios distribuídos.

Mapa de localização e hashes: `docs/architecture/PROTOTYPE-AUDIO-ISOLATION-V1.json`. Aprovações/licenças: `docs/architecture/audiovisual-pack-approvals.json`. A autorização de protótipo não concede aprovação comercial; eventual substituição/licença exige gate próprio.
