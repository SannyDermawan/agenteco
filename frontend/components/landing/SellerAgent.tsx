import type { SVGProps } from 'react'
import { AgentShell, type AgentShellProps } from './AgentShell'

// LOCKED ASSET: agent-b.svg inlined as JSX. Artwork is unchanged; only ids are
// prefixed ("seller-") so both agents can share a page, and eyes/antenna get a soft glow.
export function SellerArt(props: SVGProps<SVGSVGElement>) {
  return (
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 560" fill="none" {...props}>
  <defs>
    <linearGradient id="seller-shell-gradient" x1="505" y1="110" x2="170" y2="455" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#FFFFFF"></stop>
      <stop offset="0.55" stopColor="#F3F5F8"></stop>
      <stop offset="1" stopColor="#D9DFE8"></stop>
    </linearGradient>
    <linearGradient id="seller-shell-side-gradient" x1="470" y1="150" x2="330" y2="430" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#F9FAFC"></stop>
      <stop offset="0.7" stopColor="#E7EAF0"></stop>
      <stop offset="1" stopColor="#CBD2DC"></stop>
    </linearGradient>
    <linearGradient id="seller-shell-highlight" x1="470" y1="115" x2="310" y2="260" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95"></stop>
      <stop offset="1" stopColor="#FFFFFF" stopOpacity="0"></stop>
    </linearGradient>
    <linearGradient id="seller-face-gradient" x1="325" y1="185" x2="140" y2="350" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#273145"></stop>
      <stop offset="0.48" stopColor="#171E30"></stop>
      <stop offset="1" stopColor="#0B111F"></stop>
    </linearGradient>
    <linearGradient id="seller-seller-accent" x1="310" y1="220" x2="185" y2="320" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#8B7CF6"></stop>
      <stop offset="1" stopColor="#6D5DD3"></stop>
    </linearGradient>
    <radialGradient id="seller-antenna-gradient" cx="68%" cy="28%" r="76%">
      <stop offset="0" stopColor="#9D8FF5"></stop>
      <stop offset="0.5" stopColor="#8B7CF6"></stop>
      <stop offset="1" stopColor="#6D5DD3"></stop>
    </radialGradient>
    <linearGradient id="seller-visor-edge" x1="325" y1="185" x2="155" y2="355" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#3B465D"></stop>
      <stop offset="1" stopColor="#111827"></stop>
    </linearGradient>
    <filter id="seller-floating-depth" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="7"></feGaussianBlur>
    </filter>
  </defs>
  <g id="seller-agent-character">
    <g id="seller-antenna" style={{ filter: 'drop-shadow(0 0 9px rgba(139,92,246,.55))' }}>
      <path d="M293 133
           C290 118 285 103 276 91
           C271 84 264 83 258 87
           C253 91 252 98 255 105
           L264 136
           Z" fill="#30394C"></path>
      <path d="M277 111
           C274 99 269 91 263 87
           C261 86 259 87 258 89
           C264 99 267 111 268 123" stroke="#68738A" strokeWidth="5" strokeLinecap="round" opacity="0.42"></path>
      <circle cx="265" cy="69" r="33" fill="#182238"></circle>
      <circle cx="265" cy="69" r="28" fill="url(#seller-antenna-gradient)"></circle>
      <ellipse cx="275" cy="58" rx="10" ry="8" fill="#FFFFFF" opacity="0.46"></ellipse>
      <circle cx="265" cy="69" r="21" stroke="#9D8FF5" strokeWidth="2" opacity="0.42"></circle>
    </g>
    <g id="seller-body">
      <ellipse cx="322" cy="476" rx="137" ry="14" fill="#182133" opacity="0.09" filter="url(#seller-floating-depth)"></ellipse>
      <ellipse cx="334" cy="292" rx="183" ry="174" fill="url(#seller-shell-gradient)"></ellipse>
      <path d="M483 161
           C533 198 549 249 546 306
           C542 383 487 439 416 459
           C376 470 337 466 303 453
           C361 429 399 388 414 335
           C430 279 421 216 390 171
           C420 161 452 154 483 161
           Z" fill="url(#seller-shell-side-gradient)" opacity="0.9"></path>
      <path d="M483 169
           C521 207 534 258 530 310
           C525 369 490 415 437 440" stroke="#C7CED9" strokeWidth="5" strokeLinecap="round" opacity="0.68"></path>
      <path d="M518 320
           C501 398 433 454 349 462
           C311 465 275 456 245 438
           C282 457 325 461 363 451
           C441 431 497 383 518 320
           Z" fill="#C9D0DA" opacity="0.27"></path>
      <ellipse cx="397" cy="165" rx="128" ry="69" fill="url(#seller-shell-highlight)"></ellipse>
      <path d="M402 153
           C432 185 447 226 448 270
           C449 315 436 356 412 390" stroke="#D0D6DF" strokeWidth="4" strokeLinecap="round" opacity="0.55"></path>
      <ellipse cx="322" cy="449" rx="50" ry="17" fill="#20293B" opacity="0.86"></ellipse>
      <ellipse cx="322" cy="445" rx="38" ry="9" fill="#111827"></ellipse>
      <ellipse cx="322" cy="444" rx="27" ry="5" fill="#8B7CF6" opacity="0.58"></ellipse>
    </g>
    <g id="seller-head-shell">
      <path d="M497 242
           C497 190 467 150 421 129
           C386 113 350 111 314 119
           C353 142 377 177 387 219
           C396 257 393 300 380 337
           C369 368 351 393 327 411
           C373 410 418 394 450 365
           C481 337 498 295 497 242
           Z" fill="url(#seller-shell-gradient)"></path>
      <path d="M466 181
           C445 151 414 133 382 126" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" opacity="0.72"></path>
      <path d="M314 119
           C348 140 370 174 380 214
           C390 256 387 300 372 337
           C360 366 343 391 318 408" stroke="#C9D0DB" strokeWidth="5" strokeLinecap="round" opacity="0.8"></path>
      <path d="M427 149
           C395 127 360 117 322 120
           C301 122 282 128 264 138" stroke="#D1D7E0" strokeWidth="4" strokeLinecap="round" opacity="0.62"></path>
      <path d="M316 128
           C273 126 233 143 205 171
           C181 196 169 229 167 265
           C166 305 179 339 203 363
           C224 384 252 397 283 401
           C303 384 318 362 328 337
           C342 301 346 259 338 222
           C331 185 323 151 316 128
           Z" fill="url(#seller-shell-gradient)"></path>
      <path d="M263 139
           C222 153 193 182 180 218" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.48"></path>
    </g>
    <g id="seller-face-panel">
      <path d="M318 205
           C311 184 297 169 278 163
           C257 157 229 163 209 176
           C186 191 172 215 168 243
           C163 271 166 302 175 326
           C184 350 199 366 218 374
           C238 383 262 381 281 369
           C297 359 310 341 318 319
           C326 296 329 266 326 241
           C325 226 322 214 318 205
           Z" fill="#0C1322"></path>
      <path d="M311 211
           C304 192 291 179 275 174
           C256 168 233 173 215 185
           C194 199 181 220 177 245
           C173 271 175 297 183 319
           C191 341 204 354 220 362
           C238 371 259 368 275 359
           C290 350 300 335 308 316
           C315 296 317 270 315 246
           C314 232 313 220 311 211
           Z" fill="url(#seller-face-gradient)"></path>
      <path d="M215 184
           C192 201 179 222 175 247
           C171 272 174 299 182 320
           C190 340 203 353 220 362" stroke="url(#seller-visor-edge)" strokeWidth="5" strokeLinecap="round" opacity="0.9"></path>
      <path d="M311 212
           C317 238 319 269 315 295
           C312 318 303 338 290 351" stroke="#364157" strokeWidth="3" strokeLinecap="round" opacity="0.5"></path>
      <path d="M290 194
           C271 179 243 179 222 190" stroke="#66738A" strokeWidth="5" strokeLinecap="round" opacity="0.18"></path>
      <path d="M295 346
           C274 365 241 370 215 355" stroke="#3C465A" strokeWidth="2" strokeLinecap="round" opacity="0.5"></path>
    </g>
    <g id="seller-face">
      <path d="M302 216
           C296 194 280 181 262 177
           C281 209 290 247 288 285
           C286 318 276 344 260 361
           C280 357 295 344 304 325
           C313 302 316 273 313 247
           C311 235 308 224 302 216
           Z" fill="#4B566B" opacity="0.10"></path>
      <path d="M209 207
           C195 225 189 248 189 269" stroke="#8793A8" strokeWidth="3" strokeLinecap="round" opacity="0.12"></path>
    </g>
    <g id="seller-eyes" style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,.95))' }}>
      <g id="seller-eye-left">
        <rect x="250" y="224" width="25" height="47" rx="13" fill="url(#seller-seller-accent)" transform="rotate(5 288 255)"></rect>
        <ellipse cx="260" cy="243" rx="5" ry="8" fill="#FFFFFF" opacity="0.78"></ellipse>
      </g>
      <g id="seller-eye-right">
        <rect x="204" y="222" width="22" height="42" rx="13.5" fill="url(#seller-seller-accent)" transform="rotate(4 230 247)"></rect>
        <ellipse cx="213" cy="238" rx="5" ry="8" fill="#FFFFFF" opacity="0.84"></ellipse>
      </g>
    </g>
    <g id="seller-mouth">
     <path d="M252 302 C243 309 229 311 218 304" stroke="#6D5DD3" strokeWidth="4" strokeLinecap="round" />
     <path d="M244 305 C237 308 230 308 224 305" stroke="#B8AEFF" strokeWidth="1.5" opacity="0.62" />
    </g>
  </g>
</svg>
  )
}

export function SellerAgent(props: Omit<AgentShellProps, 'role' | 'children'>) {
  return (
    <AgentShell role="seller" {...props}>
      <SellerArt className="block h-auto w-full overflow-visible" />
    </AgentShell>
  )
}
