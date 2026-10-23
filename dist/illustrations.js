export const bookScene = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 300" fill="none" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="gz-left-page" x1="108" y1="141" x2="221" y2="198" gradientUnits="userSpaceOnUse">
      <stop stop-color="var(--illustration-paper)"/><stop offset=".75" stop-color="var(--illustration-tint)"/><stop offset="1" stop-color="var(--illustration-tint)"/>
    </linearGradient>
    <linearGradient id="gz-right-page" x1="220" y1="179" x2="340" y2="173" gradientUnits="userSpaceOnUse">
      <stop stop-color="var(--illustration-tint)"/><stop offset=".2" stop-color="var(--illustration-paper)"/><stop offset="1" stop-color="var(--illustration-paper)"/>
    </linearGradient>
    <linearGradient id="gz-cover" x1="112" y1="206" x2="333" y2="238" gradientUnits="userSpaceOnUse">
      <stop stop-color="var(--illustration-ink)"/><stop offset="1" stop-color="var(--illustration-ink)"/>
    </linearGradient>
    <filter id="gz-card-shadow" x="-50%" y="-50%" width="200%" height="220%">
      <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="var(--illustration-ink)" flood-opacity=".08"/>
    </filter>
    <filter id="gz-floor-shadow" x="-30%" y="-100%" width="160%" height="300%">
      <feGaussianBlur stdDeviation="7"/>
    </filter>
  </defs>
  <circle cx="238" cy="145" r="119" fill="var(--illustration-tint)"/>
  <circle cx="238" cy="145" r="101" stroke="var(--illustration-tint)" stroke-width=".8"/>
  <path d="M77 239H375" stroke="var(--illustration-tint)" stroke-width="1"/>
  <ellipse cx="228" cy="250" rx="112" ry="10" fill="var(--illustration-ink)" opacity=".1" filter="url(#gz-floor-shadow)"/>

  <path d="M91 175C89 148 106 128 131 119C152 111 151 91 154 77" stroke="var(--illustration-muted)" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M97 148C85 141 81 132 81 121C95 126 100 137 97 148Z" fill="var(--illustration-tint)" stroke="var(--illustration-muted)" stroke-width=".8"/>
  <path d="M111 131C108 118 113 108 122 101C127 114 124 125 111 131Z" fill="var(--illustration-tint)" stroke="var(--illustration-muted)" stroke-width=".8"/>
  <path d="M143 109C132 107 127 101 125 93C138 92 145 98 143 109Z" fill="var(--illustration-tint)" stroke="var(--illustration-muted)" stroke-width=".8"/>
  <circle cx="154" cy="75" r="3.5" fill="var(--illustration-ink)"/>

  <path d="M263 93L296 62L338 80L360 117" stroke="var(--illustration-muted)" stroke-width="1" stroke-linecap="round"/>
  <path d="M338 80L361 53" stroke="var(--illustration-muted)" stroke-width="1" stroke-dasharray="3 5"/>
  <circle cx="263" cy="93" r="4" fill="var(--illustration-line)"/>
  <circle cx="296" cy="62" r="4" fill="var(--illustration-ink)"/>
  <circle cx="338" cy="80" r="5" fill="var(--illustration-line)" stroke="var(--illustration-line)"/>
  <circle cx="360" cy="117" r="3.5" fill="var(--illustration-ink)"/>
  <circle cx="361" cy="53" r="2.5" fill="var(--illustration-line)"/>

  <g transform="rotate(-8 224 76)" filter="url(#gz-card-shadow)">
    <rect x="182" y="46" width="80" height="59" rx="6" fill="var(--illustration-paper)" stroke="var(--illustration-tint)" stroke-width="1"/>
    <rect x="192" y="58" width="16" height="17" rx="3" fill="var(--illustration-tint)"/>
    <path d="M197 63H203M197 67H203M197 71H201" stroke="var(--illustration-muted)" stroke-width="1" stroke-linecap="round"/>
    <path d="M217 61H248M217 67H238M192 86H249M192 92H230" stroke="var(--illustration-line)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M217 73H242" stroke="var(--illustration-tint)" stroke-width="1.5" stroke-linecap="round"/>
  </g>

  <path d="M109 137L220 168L337 124L351 219L228 267L103 230L109 137Z" fill="url(#gz-cover)"/>
  <path d="M103 230L228 267L351 219" stroke="var(--illustration-ink)" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M228 261V267" stroke="var(--illustration-muted)" stroke-width="1.2"/>
  <path d="M115 132C153 132 187 143 218 162L223 257C186 240 150 229 109 225L115 132Z" fill="var(--illustration-tint)" stroke="var(--illustration-line)" stroke-width=".8"/>
  <path d="M218 162C252 142 291 128 332 121L344 215C299 226 260 240 223 257L218 162Z" fill="var(--illustration-tint)" stroke="var(--illustration-line)" stroke-width=".8"/>
  <path d="M112 217C153 220 190 232 223 248C263 231 302 218 342 209M113 212C153 215 191 226 223 243C261 226 303 212 341 204" stroke="var(--illustration-line)" stroke-width=".8"/>
  <path d="M116 123C158 121 190 135 219 156L223 240C191 219 154 207 113 207L116 123Z" fill="url(#gz-left-page)" stroke="var(--illustration-line)" stroke-width=".8"/>
  <path d="M219 156C250 129 289 116 329 114L340 199C294 202 257 216 223 240L219 156Z" fill="url(#gz-right-page)" stroke="var(--illustration-line)" stroke-width=".8"/>
  <path d="M219 156L223 240" stroke="var(--illustration-line)" stroke-width="1.1"/>
  <path d="M130 142C153 143 174 150 191 159" stroke="var(--illustration-muted)" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M129 154C156 155 180 164 203 177M129 162C155 164 177 171 195 182M128 171C154 173 179 182 203 195M128 180C153 182 174 189 191 198" stroke="var(--illustration-line)" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M241 154C263 140 287 132 312 130" stroke="var(--illustration-muted)" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M242 167C266 153 290 146 315 144M242 175C263 163 283 156 304 153" stroke="var(--illustration-line)" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M244 190L262 177L283 179L307 166" stroke="var(--illustration-muted)" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="244" cy="190" r="3.5" fill="var(--illustration-tint)" stroke="var(--illustration-muted)" stroke-width=".8"/>
  <circle cx="262" cy="177" r="3.5" fill="var(--illustration-ink)"/>
  <circle cx="283" cy="179" r="3.5" fill="var(--illustration-tint)" stroke="var(--illustration-muted)" stroke-width=".8"/>
  <circle cx="307" cy="166" r="3.5" fill="var(--illustration-line)" stroke="var(--illustration-muted)" stroke-width=".8"/>
  <path d="M240 230L244 250L250 244L257 246L250 223" fill="var(--illustration-line)" stroke="var(--illustration-muted)" stroke-width=".6" stroke-linejoin="round"/>
  <circle cx="86" cy="203" r="3" fill="var(--illustration-line)"/>
  <path d="M371 188H379M375 184V192" stroke="var(--illustration-line)" stroke-width="1" stroke-linecap="round"/>
</svg>`;

export const outlineScene = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 90" fill="none" aria-hidden="true" focusable="false">
  <path d="M22 65C43 65 48 33 71 33H98C122 33 125 58 148 58H160" stroke="var(--illustration-line)" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="29" cy="64" r="12" fill="var(--illustration-tint)"/>
  <circle cx="29" cy="64" r="4" fill="var(--illustration-ink)"/>
  <rect x="66" y="17" width="32" height="32" rx="9" fill="var(--illustration-paper)" stroke="var(--illustration-line)"/>
  <path d="M76 27H88M76 32H88M76 37H83" stroke="var(--illustration-muted)" stroke-width="1.3" stroke-linecap="round"/>
  <circle cx="146" cy="58" r="10" fill="var(--illustration-tint)"/>
  <circle cx="146" cy="58" r="3.5" fill="var(--illustration-muted)"/>
  <path d="M33 33H48M111 72H124" stroke="var(--illustration-tint)" stroke-width="1.3" stroke-linecap="round"/>
  <circle cx="121" cy="16" r="2" fill="var(--illustration-line)"/>
</svg>`;
