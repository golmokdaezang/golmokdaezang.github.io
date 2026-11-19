from pathlib import Path
import re
import shutil

root = Path.cwd()
cabin = root / 'cabin/index.html'
shelf = root / 'bookshelf/index.html'
if not cabin.is_file() or not shelf.is_file():
    raise SystemExit('ERROR: Run from the repository root (cabin/index.html and bookshelf/index.html required).')
a = cabin.read_text(encoding='utf-8-sig')
b = shelf.read_text(encoding='utf-8-sig')
if 'class="cabin-bookshelf-link"' not in a:
    raise SystemExit('ERROR: Cabin bookshelf link not found. No files changed.')
if '<main class="scene"' not in b or '</style>' not in b:
    raise SystemExit('ERROR: Bookshelf HTML structure differs. No files changed.')

# SVG cursor uses strokes, warm brass, small dark shadow and a wooden handle.
cursor_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
<path d="M24 25 35 36" stroke="#1d1008" stroke-width="6" stroke-linecap="round"/>
<path d="M24 25 35 36" stroke="#b68145" stroke-width="3.5" stroke-linecap="round"/>
<circle cx="16" cy="16" r="11" fill="#151a1b" fill-opacity=".3" stroke="#281609" stroke-width="5"/>
<circle cx="16" cy="16" r="11" fill="#c4d5d2" fill-opacity=".2" stroke="#e8c58b" stroke-width="3"/>
<path d="M10 12q3-5 8-5" stroke="#fff2d4" stroke-width="2" stroke-linecap="round" fill="none" opacity=".85"/>
</svg>'''

# Idempotent: remove previous polish block if present, avoid stacking.
start = '/* === GOLDEN INTERACTION HINTS START === */'
end = '/* === GOLDEN INTERACTION HINTS END === */'
a = re.sub(re.escape(start)+r'.*?'+re.escape(end), '', a, flags=re.S)
# Previous tooltip version, if installed.
a = re.sub(r'/\* 서가 진입 안내:.*?(?=\.cabin-bookshelf-link:focus-visible)', '', a, flags=re.S)
a = a.replace('cursor: zoom-in;', 'cursor: pointer;')
a = a.replace('title="책장 살펴보기"', '')
# Remove native tooltip from poster, but preserve its other attributes.
a = a.replace('title="클릭하면 포스터를 숨깁니다"', '')
# Put semantic labels on actual clickable elements, no JS needed.
hints = {
 'lantern': '랜턴 불빛 바꾸기',
 'cabin-door': '갑판으로 나가기',
 'cabin-map': '항해 지도 펼치기',
 'cabin-bookshelf-link': '서가를 살펴보기',
 'captain-profile-toggle': '선장 프로필 펼치기',
 'captain-edit': '프로필 수정하기',
 'captain-login': '선장실 로그인',
 'captain-logout': '로그아웃',
 'captain-profile': '포스터 접어두기',
}
for identifier, label in hints.items():
    # insert data-hint into the opening tag only, matching id or class for door/map.
    pattern = r'<(?:a|button|section)\b[^>]*?(?:\bid="'+re.escape(identifier)+r'"|\bclass="'+re.escape(identifier)+r'")[^>]*>'
    match = re.search(pattern, a, flags=re.S)
    if not match:
        raise SystemExit(f'ERROR: Missing Cabin control {identifier}. No files changed.')
    tag = match.group(0)
    tag = re.sub(r'\sdata-hint="[^"]*"', '', tag)
    tag = tag[:-1] + f' data-hint="{label}">'
    a = a[:match.start()] + tag + a[match.end():]

css = '''
/* === GOLDEN INTERACTION HINTS START === */
/* 고풍스러운 돋보기: 클릭 가능한 부분에만 표시 */
.cabin .lantern, .cabin .cabin-door, .cabin .cabin-map,
.cabin .cabin-bookshelf-link, .cabin .captain-ui a,
.cabin .captain-ui button, .cabin .captain-profile {
  cursor: url('/assets/images/antique-magnifier-cursor.svg') 16 16, pointer;
}
/* 조용한 금빛 툴팁. 툴팁은 클릭 영역 바깥에도 보임 */
.cabin [data-hint] { position: absolute; }
.cabin [data-hint]::after {
  content: attr(data-hint);
  position: absolute;
  left: 50%; top: calc(100% + 9px);
  transform: translate(-50%, -4px);
  z-index: 70;
  width: max-content; max-width: min(260px, 75vw);
  padding: 5px 11px;
  border-top: 1px solid rgba(201,161,94,.65);
  border-bottom: 1px solid rgba(201,161,94,.65);
  background: rgba(24,17,12,.85);
  color: #d9b982;
  font-family: 'Gowun Batang', Georgia, serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.55;
  letter-spacing: .09em;
  text-align: center;
  white-space: normal;
  text-shadow: 0 1px 3px rgba(0,0,0,.8);
  box-shadow: 0 4px 12px rgba(0,0,0,.2);
  opacity: 0; visibility: hidden;
  pointer-events: none;
  transition: opacity .18s ease, transform .18s ease, visibility .18s;
}
.cabin [data-hint]:hover::after,
.cabin [data-hint]:focus-visible::after {
  opacity: 1; visibility: visible;
  transform: translate(-50%, 0);
}
/* 상단 메뉴의 원래 배치를 유지한다. */
.cabin .captain-topbar [data-hint] { position: relative; }
/* 프로필 포스터는 왼쪽에 있으므로 안내 문구도 안쪽에 표시 */
.cabin .captain-profile[data-hint]::after { top: 10px; left: 50%; }
/* 책장 설명은 책 바로 아래에 조용히 표시 */
.cabin .cabin-bookshelf-link[data-hint]::after { top: calc(100% + 7px); }
@media (hover: none) { .cabin [data-hint]::after { display: none; } }
/* === GOLDEN INTERACTION HINTS END === */
'''
# Important: existing .captain-ui has pointer-events none and z-index; don't override.
a = a.replace('</style>', css + '\n</style>', 1)

# Bookshelf return link: desk/cabin, not generic back, subtle fixed corner.
return_css = '''
/* === BOOKSHELF RETURN START === */
.desk-return {
  position: fixed;
  z-index: 95;
  left: max(15px, env(safe-area-inset-left));
  top: max(15px, env(safe-area-inset-top));
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border: 1px solid rgba(202,165,103,.55);
  border-radius: 3px;
  background: rgba(26,19,13,.67);
  color: #ddbd86;
  font-family: 'Gowun Batang', Georgia, serif;
  font-size: 12px;
  letter-spacing: .08em;
  text-decoration: none;
  text-shadow: 0 1px 4px #000;
  backdrop-filter: blur(3px);
  cursor: url('/assets/images/antique-magnifier-cursor.svg') 16 16, pointer;
  transition: background .2s, border-color .2s, color .2s;
}
.desk-return:hover, .desk-return:focus-visible {
  background: rgba(56,37,22,.84);
  border-color: rgba(239,198,123,.8);
  color: #f2d6a2;
}
.desk-return:focus-visible { outline: 2px solid #ddbd86; outline-offset: 3px; }
/* === BOOKSHELF RETURN END === */
'''
b = re.sub(r'/\* === BOOKSHELF RETURN START === \*/.*?/\* === BOOKSHELF RETURN END === \*/', '', b, flags=re.S)
# remove older versions of the back link, if present
b = re.sub(r'\s*<a class="(?:desk-return|cabin-return)"[^>]*>.*?</a>', '', b, flags=re.S)
b = b.replace('</style>', return_css + '\n</style>', 1)
b = b.replace('<body>', '<body>\n  <a class="desk-return" href="/cabin/" aria-label="책상으로 돌아가기">〈 &nbsp;책상으로 돌아가기</a>', 1)

# Backups are created before writing; no files touched on validation failure.
for path in (cabin, shelf):
    backup = path.with_name(path.name + '.before-gold-ui.bak')
    if not backup.exists():
        shutil.copy2(path, backup)
asset = root / 'assets/images/antique-magnifier-cursor.svg'
asset.parent.mkdir(parents=True, exist_ok=True)
asset.write_text(cursor_svg, encoding='utf-8')
cabin.write_text(a, encoding='utf-8')
shelf.write_text(b, encoding='utf-8')
print('SUCCESS: Cabin hover labels, antique magnifier cursor, bookshelf desk return button installed.')
print('Changed: cabin/index.html, bookshelf/index.html, assets/images/antique-magnifier-cursor.svg')
print('Backups: cabin/index.html.before-gold-ui.bak and bookshelf/index.html.before-gold-ui.bak')
