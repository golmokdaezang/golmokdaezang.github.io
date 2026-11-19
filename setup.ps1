$ErrorActionPreference = 'Stop'
$root = 'C:\Blog\golmokdaezang.github.io'
Set-Location $root
if (!(Test-Path 'blog.html')) { throw 'blog.html 파일을 찾을 수 없습니다.' }
$utf8 = New-Object System.Text.UTF8Encoding($false)
$books = @(
  @{id='blue'; name='파란 책'; desc='첫 번째 기록'; color='#315a87'; symbol='✧'; image='book-blue.png'},
  @{id='green'; name='초록 책'; desc='두 번째 기록'; color='#467657'; symbol='⚓'; image='book-green.png'},
  @{id='purple'; name='보라 책'; desc='세 번째 기록'; color='#78538a'; symbol='✺'; image='book-purple.png'},
  @{id='brown'; name='갈색 책'; desc='네 번째 기록'; color='#97643a'; symbol='◎'; image='book-brown.png'},
  @{id='aqua'; name='아쿠아 책'; desc='다섯 번째 기록'; color='#2a929a'; symbol='⚓'; image='book-aqua.png'},
  @{id='black'; name='검정 책'; desc='여섯 번째 기록'; color='#46484b'; symbol='☠'; image='book-black.png'}
)
New-Item -ItemType Directory -Force '_data' | Out-Null
if (!(Test-Path '_data/books.yml')) {
  $yaml = @('# 책 이름(name)과 소개(description)를 변경하면 전체 기록실에 반영됩니다.','# id는 게시글 분류 및 주소에 사용하므로 변경하지 마세요.')
  foreach ($b in $books) {
    $yaml += "- id: $($b.id)"
    $yaml += "  name: `"$($b.name)`""
    $yaml += "  description: `"$($b.desc)`""
    $yaml += "  color: `"$($b.color)`""
    $yaml += "  symbol: `"$($b.symbol)`""
    $yaml += "  image: `"/assets/images/books/$($b.image)`""
  }
  [System.IO.File]::WriteAllText((Join-Path $root '_data/books.yml'), ($yaml -join "`n") + "`n", $utf8)
}
Copy-Item 'blog.html' 'blog.html.before-book-sync.bak' -Force
$blogPath = Join-Path $root 'blog.html'
$blog = [System.IO.File]::ReadAllText($blogPath)
$startMarker = '<div class="shelf-track">'
$endMarker = '</div>'
$start = $blog.IndexOf($startMarker)
if ($start -lt 0) { throw '기존 blog.html에서 shelf-track을 찾지 못했습니다. 파일을 변경하지 않았습니다.' }
$end = $blog.IndexOf($endMarker, $start + $startMarker.Length)
if ($end -lt 0) { throw '책 목록의 끝을 찾지 못했습니다.' }
$replacement = @'
<div class="shelf-track">
        {% for book in site.data.books %}
        <a class="book-tile" href="{{ '/blog/' | append: book.id | append: '/' | relative_url }}" style="background:linear-gradient(125deg,#182335,{{ book.color }})">
          <span class="book-symbol">{{ book.symbol }}</span><strong>{{ book.name | escape }}</strong><span>{{ book.description | escape }}</span>
        </a>
        {% endfor %}
'@
$blog = $blog.Substring(0,$start) + $replacement + $blog.Substring($end)
$oldNote = '<p class="archive-note">책별 페이지는 다음 단계에서 만들 예정이야. 지금은 링크를 눌러도 404가 나올 수 있어.</p>'
$newNote = '<p class="archive-note">Book names can be edited in the settings section below.</p>'
$blog = $blog.Replace($oldNote,$newNote)
$manage = @'
  <section class="archive-section" aria-labelledby="manageBooksTitle">
    <div class="section-heading"><h2 id="manageBooksTitle">⚙ 책 이름 관리</h2><small>BOOK SETTINGS</small></div>
    <p>책 이름과 소개를 한 곳에서 관리해. <code>id</code>는 주소와 게시글 분류에 사용하므로 그대로 유지해 줘.</p>
    <a class="action-link" href="https://github.com/golmokdaezang/golmokdaezang.github.io/edit/main/_data/books.yml" target="_blank" rel="noopener noreferrer"><span class="action-icon">✎</span><strong>책 이름 수정하기</strong><small>GitHub 로그인 → name 수정 → Commit changes</small></a>
    <p class="archive-note">현재는 GitHub 편집 화면에서 저장하는 방식이야. 중앙 기록실 안에서 바로 저장하는 기능은 GitHub 인증을 연결한 뒤 구현할 수 있어.</p>
  </section>

'@
if ($blog -notmatch 'manageBooksTitle') {
  $needle = '  <section class="archive-section" aria-labelledby="createTitle">'
  if (!$blog.Contains($needle)) { throw '관리 영역을 넣을 위치를 찾지 못했습니다.' }
  $blog = $blog.Replace($needle,$manage+$needle)
}
[System.IO.File]::WriteAllText($blogPath,$blog,$utf8)
foreach ($b in $books) {
  $dir = Join-Path $root ("blog\"+$b.id)
  New-Item -ItemType Directory -Force $dir | Out-Null
  $page = @'
---
layout: page
permalink: /blog/BOOK_ID/
---
{% assign book = site.data.books | where: 'id', 'BOOK_ID' | first %}
<h1>{{ book.name | escape }}</h1>
<p>{{ book.description | escape }}</p>
<p><a href="{{ '/blog/' | relative_url }}">← 중앙 기록실로 돌아가기</a></p>
{% assign book_posts = site.posts | where: 'categories', 'BOOK_ID' %}
{% for post in book_posts %}
<article style="margin:1.5rem 0"><h2><a href="{{ post.url | relative_url }}">{{ post.title | escape }}</a></h2><time>{{ post.date | date: '%Y.%m.%d' }}</time><p>{{ post.excerpt | strip_html | truncate: 130 }}</p></article>
{% else %}
<p>아직 이 책에 기록이 없어.</p>
{% endfor %}
'@
  $page = $page.Replace('BOOK_ID',$b.id)
  [System.IO.File]::WriteAllText((Join-Path $dir 'index.md'),$page,$utf8)
}
Write-Host '완료: _data/books.yml, blog.html, 책별 페이지 6개' -ForegroundColor Green
Write-Host '책 이름 변경: _data/books.yml 의 name 필드 수정' -ForegroundColor Cyan
Write-Host '다음 명령어: git add blog.html blog/ _data/books.yml; git commit -m "Centralize book names"; git push origin main'
