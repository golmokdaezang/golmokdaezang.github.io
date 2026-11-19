---
layout: page
permalink: /blog/aqua/
---
{% assign book = site.data.books | where: 'id', 'aqua' | first %}
<h1>{{ book.name | escape }}</h1>
<p>{{ book.description | escape }}</p>
<p><a href="{{ '/blog/' | relative_url }}">← 중앙 기록실로 돌아가기</a></p>
{% assign book_posts = site.posts | where: 'categories', 'aqua' %}
{% for post in book_posts %}
<article style="margin:1.5rem 0"><h2><a href="{{ post.url | relative_url }}">{{ post.title | escape }}</a></h2><time>{{ post.date | date: '%Y.%m.%d' }}</time><p>{{ post.excerpt | strip_html | truncate: 130 }}</p></article>
{% else %}
<p>아직 이 책에 기록이 없어.</p>
{% endfor %}