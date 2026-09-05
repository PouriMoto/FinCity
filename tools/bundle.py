#!/usr/bin/env python3
"""
bundle.py — سازنده‌ی index.html هر بازی روایت‌محور از فایل‌های ماژولار src/

این اسکریپت فقط برای «نویسندگی» است — چیزی که در هاست/وردپرس آپلود می‌کنی همان
index.html تولیدشده است (خودکفا، بدون نیاز به build در سمت سرور یا کاربر).

استفاده:
    python3 tools/bundle.py <game-slug>          # فقط همان بازی
    python3 tools/bundle.py --all                # همه‌ی بازی‌های روایت‌محور

هر بار source (src/) عوض شد، دوباره اجرا کن تا index.html به‌روز شود — hand-edit
کردن index.html اشتباه است، چون با اجرای بعدی این اسکریپت overwrite می‌شود.
"""
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHARED = ROOT / 'shared-src'
GAMES = ROOT / 'games'

ROUGH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/rough.js/2.1.1/rough.umd.min.js'
FONT_LINK = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap'

TEMPLATE = """<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="{font_link}" rel="stylesheet">
<style>
{shared_css}

/* ---- استایل مخصوص همین بازی (game-style.css) ---- */
{game_css}
</style>
</head>
<body>
{scenes_html}

<script src="{rough_cdn}"></script>
{extra_cdn}
<script>
{draw_helpers_js}
</script>
<script>
{scene_engine_js}
</script>
<script>
{tangle_lite_js}
</script>
<script>
{game_logic_js}
</script>
</body>
</html>
"""


def read(path):
    if not path.exists():
        raise FileNotFoundError(f'فایل پیدا نشد: {path}')
    return path.read_text(encoding='utf-8')


def bundle_game(slug):
    game_dir = GAMES / slug
    src_dir = game_dir / 'src'
    if not src_dir.exists():
        print(f'⏭  {slug}: پوشه‌ی src/ ندارد (احتمالاً بازی نوع «ابزار+ویزارد» است) — رد شد.')
        return

    scenes_html = read(src_dir / 'scenes.html')

    js_files = sorted(src_dir.glob('*.js'))
    if not js_files:
        raise FileNotFoundError(f'{slug}: هیچ فایل .js در src/ نیست')
    js_parts = []
    for f in js_files:
        js_parts.append(f'\n/* ---- {f.name} ---- */\n' + read(f))
    game_logic_js = '\n'.join(js_parts)

    css_files = sorted(src_dir.glob('*.css'))
    game_css = '\n\n'.join(read(f) for f in css_files) if css_files else '/* بدون استایل اختصاصی */'

    extra_cdn = ''
    cdn_file = src_dir / 'extra-cdn.txt'
    if cdn_file.exists():
        extra_cdn = '\n'.join(
            f'<script src="{line.strip()}"></script>'
            for line in cdn_file.read_text(encoding='utf-8').splitlines() if line.strip()
        )

    title_line = scenes_html.split('data-title="', 1)
    title = title_line[1].split('"', 1)[0] if len(title_line) > 1 else slug

    html = TEMPLATE.format(
        title=title,
        font_link=FONT_LINK,
        rough_cdn=ROUGH_CDN,
        extra_cdn=extra_cdn,
        shared_css=read(SHARED / 'paper-theme.css'),
        game_css=game_css,
        scenes_html=scenes_html,
        draw_helpers_js=read(SHARED / 'draw-helpers.js'),
        scene_engine_js=read(SHARED / 'scene-engine.js'),
        tangle_lite_js=read(SHARED / 'tangle-lite.js'),
        game_logic_js=game_logic_js,
    )

    out_path = game_dir / 'index.html'
    out_path.write_text(html, encoding='utf-8')
    print(f'✅ {slug}: {out_path.relative_to(ROOT)} ساخته شد ({len(html.splitlines())} خط تولیدشده, از {len(js_files)} فایل js + {len(css_files)} فایل css)')


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    if sys.argv[1] == '--all':
        for game_dir in sorted(GAMES.iterdir()):
            if game_dir.is_dir():
                bundle_game(game_dir.name)
    else:
        bundle_game(sys.argv[1])


if __name__ == '__main__':
    main()
