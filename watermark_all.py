#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
watermark_all — единый стандарт водяного знака @GenVidPro для genvidpro.com.

    python watermark_all.py файл.mp4 [ещё файлы...]     пометить конкретные файлы
    python watermark_all.py --check файл.mp4            вырезать угол на проверку
    python watermark_all.py --site                      пересобрать весь сайт из чистых мастеров
    python watermark_all.py --masters                   пересобрать портфолио на Google Drive

СПЕЦИФИКАЦИЯ (не менять — это стандарт для всех будущих роликов):
    текст        @GenVidPro
    шрифт        Poppins-Bold, если найдётся, иначе Arial Bold
    позиция      правый верхний угол
    отступ       4 % от МЕНЬШЕЙ стороны кадра
    кегль        4.5 % от МЕНЬШЕЙ стороны кадра
    цвет         белый, непрозрачность 42 %
    тень         чёрная 30 %, смещение 1 px / 1 px

Почему от МЕНЬШЕЙ стороны, а не от ширины. Раньше кегль считался от ширины кадра,
и на вертикали 1080x1920 знак выходил в 1.78 раза мельче, чем на горизонтали
1920x1080. В карусели, где у всех карточек одна высота, вертикаль ужимается
сильнее горизонтали — и знак на ней переставал читаться совсем. min(w,h) даёт
одинаковый кегль в пикселях на любой ориентации.

ДВОЙНОЙ ЗНАК. Скрипт ничего не распознаёт на картинке: пометить уже помеченный
файл он не откажется. Поэтому подавать сюда только чистый исходник. Чистые
мастера роликов лежат в «Мой диск\\00 — CLEAN masters (no watermark)».

КЭШ. Заменить файл под тем же именем мало: `_headers` держит /videos/* и /media/*
неделю, и край Cloudflare продолжит отдавать прежнюю версию. Поэтому у всех ссылок
в index.html стоит метка версии (?v=wm2). Перештамповал файлы — подними метку на
следующую (wm3, wm4...) одной заменой по index.html, иначе посетители неделю будут
видеть старый знак.

ЛИМИТ ХОСТИНГА. Cloudflare Pages не принимает файл больше 25 MiB. crf 18 из
спецификации на длинных роликах его пробивает, поэтому такие файлы досжимаются
двухпроходным x264 под 23.5 MiB — об этом печатается отдельная строка.
"""

import os, subprocess, sys, glob, shutil

SITE = os.path.dirname(os.path.abspath(__file__))
MEDIA = os.path.join(SITE, 'media')
VIDEOS = os.path.join(SITE, 'videos')
MOBILE = os.path.join(VIDEOS, 'm')
MASTERS = r'C:\Users\romac\Мой диск\00 — CLEAN masters (no watermark)'
PORTFOLIO = r'C:\Users\romac\Мой диск\GenVidPro — Portfolio (Roman Chorny)'

TEXT = '@GenVidPro'
FONT_SIZE_PCT = 0.045
MARGIN_PCT = 0.04
OPACITY = 0.42
SHADOW = 0.30
LIMIT = int(23.5 * 1024 * 1024)          # запас под лимит Cloudflare в 25 MiB

# «Мобильные» копии: имя на сайте -> (длинная сторона, потолок веса в байтах).
# Потолок — вес прежней копии: эти файлы заведены ради быстрой загрузки на
# телефоне, и вырасти вдвое им нельзя, иначе смысл их существования пропадает.
MOBILE_SPEC = {
    'cinematic-showreel': (720, 6_700_000),
    'hook-test-axion': (720, 1_100_000),
    'live-ai-world': (720, 1_900_000),
    'robert-worlds-v2': (1280, 4_300_000),
    'emblem': (400, 250_000),
}

# Ролик на сайте -> файл чистого мастера.
MASTER_MAP = {
    'robert-worlds': '1 — Robert\u2019s Worlds (39s, real boy + AI worlds, 9-16 vertical).mp4',
    'hook-test-axion': '2 — Hook Test AXION (22s, 9-16 vertical).mp4',
    'product-ads-showreel': '3 — Product Ads Showreel (5 spots, 4-5 for feed).mp4',
    'ai-doesnt-work-without-you-60s-film': '4 — AI Doesn\u2019t Work Without You (60s film, 16-9).mp4',
    'shelter': '5 — SHELTER (75s spec ad, 16-9).mp4',
    'molt': '6 — MOLT (30s narrative short, 2.39-1).mp4',
    'live-ai-world': '7 — Real Actor, AI World (41s, live + AI, 16-9).mp4',
    'cinematic-showreel': '8 — Cinematic Showreel.mp4',
    'logo-animation-showreel': '9 — Logo Animation Showreel (14 logos).mp4',
    'mushroom-timelapse': '10 — Mushroom Timelapse (43s, 9-16 vertical).mp4',
    'ai-doesnt-work-without-you-17s-social-cut': '11 — AI Doesn\u2019t Work Without You (17s social cut, 16-9).mp4',
}


def font_path():
    for p in (os.path.join(SITE, 'fonts', 'Poppins-Bold.ttf'),
              r'C:\Windows\Fonts\Poppins-Bold.ttf',
              r'C:\Windows\Fonts\arialbd.ttf'):
        if os.path.isfile(p):
            return p
    sys.exit('не нашёл ни Poppins-Bold, ни Arial Bold')


FONT = font_path()


def ff_font(p):
    """Путь к шрифту внутри фильтра: двоеточие диска экранируется."""
    return p.replace('\\', '/').replace(':', '\\:')


def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                        '-show_entries', 'stream=width,height',
                        '-show_entries', 'format=duration',
                        '-of', 'csv=p=0:s=,', path], capture_output=True, text=True)
    nums = [x for x in r.stdout.replace('\n', ',').split(',') if x.strip()]
    w, h, dur = int(nums[0]), int(nums[1]), float(nums[2])
    return w, h, dur


def has_audio(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0',
                        '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', path],
                       capture_output=True, text=True)
    return 'audio' in r.stdout


def drawtext(w, h, scale_to=None):
    """Кегль и отступ считаются от кадра, каким он станет ПОСЛЕ масштабирования,
    иначе у мобильной копии знак уехал бы вместе с уменьшением картинки."""
    if scale_to:
        k = scale_to / float(max(w, h))
        w, h = w * k, h * k
    side = min(w, h)
    size = max(10, int(round(side * FONT_SIZE_PCT)))
    margin = int(round(side * MARGIN_PCT))
    return ("drawtext=fontfile='%s':text='%s':fontsize=%d:fontcolor=white@%s"
            ":shadowcolor=black@%s:shadowx=1:shadowy=1:x=w-tw-%d:y=%d"
            % (ff_font(FONT), TEXT, size, OPACITY, SHADOW, margin, margin))


def stamp_video(src, dst, scale_to=None, crf=18, limit=LIMIT, quiet=False):
    w, h, dur = probe(src)
    vf = drawtext(w, h, scale_to)
    if scale_to:
        long_side = 'w' if w >= h else 'h'
        vf = ('scale=%d:-2' % scale_to if long_side == 'w' else 'scale=-2:%d' % scale_to) + ',' + vf
    tmp = dst + '.tmp.mp4'
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf,
           '-c:v', 'libx264', '-crf', str(crf), '-preset', 'slow',
           '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
    cmd += ['-c:a', 'copy'] if has_audio(src) else ['-an']
    subprocess.run(cmd + [tmp], check=True)
    size = os.path.getsize(tmp)

    if size > limit:
        # Не влезли в лимит хостинга — пережимаем под целевой битрейт в два прохода.
        abr = 96 if has_audio(src) else 0
        vbr = int((limit * 8 / dur) / 1000) - abr - 40
        if not quiet:
            print('      > %.1f МБ при crf %d, пережимаю в два прохода под %d кбит/с'
                  % (size / 1048576.0, crf, vbr))
        log = dst + '.pass'
        base = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf,
                '-c:v', 'libx264', '-b:v', '%dk' % vbr, '-preset', 'veryslow',
                '-pix_fmt', 'yuv420p', '-passlogfile', log]
        subprocess.run(base + ['-pass', '1', '-an', '-f', 'null', os.devnull], check=True)
        cmd2 = base + ['-pass', '2', '-movflags', '+faststart']
        cmd2 += ['-c:a', 'aac', '-b:a', '%dk' % abr] if abr else ['-an']
        subprocess.run(cmd2 + [tmp], check=True)
        for f in glob.glob(log + '*'):
            os.remove(f)
        size = os.path.getsize(tmp)

    os.replace(tmp, dst)
    return size


def stamp_image(src, dst, width=None):
    w, h, _ = probe(src)
    vf = drawtext(w, h, width)
    if width:
        vf = 'scale=%d:-2,' % width + vf
    tmp = dst + '.tmp.jpg'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf,
                    '-q:v', '2', tmp], check=True)
    os.replace(tmp, dst)
    return os.path.getsize(dst)


def poster_time(video):
    """Тот же выбор кадра, что и в _tools/genvidpro_video.py: первый кадр, а если
    начало затемнено — самый светлый кадр первых четырёх секунд."""
    def luma(t):
        r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', video,
                            '-frames:v', '1', '-vf', 'scale=32:18',
                            '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], capture_output=True)
        return sum(r.stdout) / len(r.stdout) if r.stdout else 0
    if luma(0.0) < 25:
        return max((round(x * 0.25, 2) for x in range(1, 17)), key=luma)
    return 0.0


def make_poster(stamped_video, base):
    """Обложка режется из УЖЕ помеченного ролика — знак приходит вместе с кадром,
    второй раз его накладывать не нужно и нельзя."""
    out = os.path.join(MEDIA, base + '.jpg')
    t = poster_time(stamped_video)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', stamped_video,
                    '-frames:v', '1', '-vf', 'scale=1600:-2', '-q:v', '2', out], check=True)
    return out


def make_preview(stamped_video, base):
    out = os.path.join(MEDIA, base + '-preview.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', stamped_video, '-t', '6', '-an',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '26',
                    '-vf', 'scale=960:-2', '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', out], check=True)
    return out


def check(path, out_dir=None):
    """Вырезает правый верхний угол — посмотреть глазами, что знак ровно один."""
    out_dir = out_dir or os.path.join(SITE, '_wm_check')
    os.makedirs(out_dir, exist_ok=True)
    name = os.path.relpath(path, SITE).replace('\\', '_').replace('/', '_')
    out = os.path.join(out_dir, name + '.png')
    src = ['-i', path] if path.lower().endswith(('.jpg', '.png')) else ['-ss', '1', '-i', path]
    subprocess.run(['ffmpeg', '-v', 'error', '-y'] + src + ['-frames:v', '1',
                    '-vf', 'crop=iw*0.45:ih*0.14:iw*0.55:0,scale=560:-1:flags=lanczos', out],
                   check=True)
    return out


def rebuild_site():
    print('Пересборка всех визуалов сайта из чистых мастеров.\n')
    for base, master in MASTER_MAP.items():
        src = os.path.join(MASTERS, master)
        if not os.path.isfile(src):
            sys.exit('нет чистого мастера: %s' % src)
        dst = os.path.join(VIDEOS, base + '.mp4')
        w, h, dur = probe(src)
        print('  %-44s %dx%d  %.0f c' % (base, w, h, dur))
        size = stamp_video(src, dst)
        print('      ролик    %6.1f МБ' % (size / 1048576.0))
        p = make_poster(dst, base)
        print('      обложка  %6.1f МБ' % (os.path.getsize(p) / 1048576.0))
        v = make_preview(dst, base)
        print('      превью   %6.1f МБ' % (os.path.getsize(v) / 1048576.0))

    print('\n  Мобильные копии:')
    for name, (long_side, cap) in MOBILE_SPEC.items():
        if name == 'emblem':
            continue
        base = name[:-3] if name.endswith('-v2') else name
        src = os.path.join(MASTERS, MASTER_MAP[base])
        dst = os.path.join(MOBILE, name + '.mp4')
        # Мобильные копии существуют ради лёгкости: crf 18 сделал бы их втрое
        # тяжелее прежних и убил бы ту самую экономию, ради которой они заведены.
        size = stamp_video(src, dst, scale_to=long_side, crf=26, limit=cap)
        print('    m/%-28s %6.1f МБ' % (name + '.mp4', size / 1048576.0))

    print('\n  Эмблема шапки (чистая, знака на ней не было):')
    # Чистая эмблема лежит вне папки деплоя, чтобы не улететь на хостинг лишним файлом.
    emb_clean = os.path.join(r'C:\Users\romac\Downloads\genvidpro-video-src', 'emblem-clean.mp4')
    if not os.path.isfile(emb_clean):
        sys.exit('нужен чистый исходник эмблемы: %s' % emb_clean)
    size = stamp_video(emb_clean, os.path.join(MEDIA, 'emblem.mp4'), crf=20, limit=1_200_000)
    print('    media/emblem.mp4              %6.1f МБ' % (size / 1048576.0))
    size = stamp_video(emb_clean, os.path.join(MOBILE, 'emblem.mp4'),
                       scale_to=MOBILE_SPEC['emblem'][0], crf=26, limit=MOBILE_SPEC['emblem'][1])
    print('    videos/m/emblem.mp4          %6.1f МБ' % (size / 1048576.0))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(poster_time(os.path.join(MEDIA, 'emblem.mp4'))),
                    '-i', os.path.join(MEDIA, 'emblem.mp4'), '-frames:v', '1',
                    '-q:v', '2', os.path.join(MEDIA, 'emblem-poster.jpg')], check=True)
    print('    media/emblem-poster.jpg      %6.1f МБ'
          % (os.path.getsize(os.path.join(MEDIA, 'emblem-poster.jpg')) / 1048576.0))
    print('\nГотово. Личное фото media/roman-chorny.jpg не трогалось.')


def rebuild_masters():
    """Папка портфолио на Google Drive: каждый ролик пересобирается из чистого
    мастера с новым знаком. Лимита в 25 MiB тут нет — это выдача заказчику,
    поэтому crf 18 без досжатия."""
    if not os.path.isdir(PORTFOLIO):
        sys.exit('нет папки портфолио: %s' % PORTFOLIO)
    names = sorted((f for f in os.listdir(MASTERS) if f.lower().endswith('.mp4')),
                   key=lambda f: int(f.split(' —')[0]))
    print('Пересборка портфолио на Drive из чистых мастеров.\n')
    for f in names:
        src = os.path.join(MASTERS, f)
        dst = os.path.join(PORTFOLIO, f)
        w, h, dur = probe(src)
        size = stamp_video(src, dst, crf=18, limit=float('inf'))
        print('  %-62s %dx%d  %5.1f МБ' % (f[:62], w, h, size / 1048576.0))
    print('\nГотово: %d роликов, знак ровно один на каждом.' % len(names))


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    if args[0] == '--site':
        rebuild_site()
    elif args[0] == '--masters':
        rebuild_masters()
    elif args[0] == '--check':
        for a in args[1:]:
            print(check(a))
    else:
        for a in args:
            w, h, _ = probe(a)
            size = (stamp_image(a, a) if a.lower().endswith(('.jpg', '.jpeg', '.png'))
                    else stamp_video(a, a))
            print('%-50s %dx%d  %.1f МБ' % (os.path.basename(a), w, h, size / 1048576.0))
