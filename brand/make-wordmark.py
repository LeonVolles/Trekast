"""Sets the Trekast wordmark and writes brand/wordmark.svg (green) and brand/wordmark-white.svg.

The letters are Bricolage Grotesque ExtraBold (opsz 96, OFL), shaped with HarfBuzz so the kerning is the font's own.
The k is drawn here: the font's stem plus a round C (stroke 130) whose back sits 75 units deep in the stem,
so the k reads first and the C of "cast" shows in its arms.

Needs: pip install fonttools uharfbuzz
Run:   python3 brand/make-wordmark.py path/to/BricolageGrotesque-800.ttf
       (the static instance Google Fonts serves for family=Bricolage+Grotesque:opsz,wght@96,800)
"""
import sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

FONT = sys.argv[1]
TEXT = "Trekast"
STEM, STEM_RIGHT = "M36 0V700H194V0Z", 194
C_STROKE, C_DEPTH, X_HEIGHT, K_RIGHT = 130, 75, 528, 528


def k_c():
    """Centreline of the C: top arm along the x-height, round back, bottom arm along the baseline."""
    t = C_STROKE
    yt, yb, ym = X_HEIGHT - t / 2, t / 2, X_HEIGHT / 2
    r = (yt - yb) / 2
    x = STEM_RIGHT - C_DEPTH + t / 2
    cx, h = x + r, 0.5523 * r
    return (f"M{K_RIGHT} {yt:g}H{cx:g}C{cx - h:g} {yt:g} {x:g} {ym + h:g} {x:g} {ym:g}"
            f"C{x:g} {ym - h:g} {cx - h:g} {yb:g} {cx:g} {yb:g}H{K_RIGHT}")


font = TTFont(FONT)
glyph_set, order = font.getGlyphSet(), font.getGlyphOrder()
hb_font = hb.Font(hb.Face(hb.Blob.from_file_path(FONT)))
buf = hb.Buffer()
buf.add_str(TEXT)
buf.guess_segment_properties()
hb.shape(hb_font, buf, {"kern": True, "liga": False})

parts, x, xmin, xmax, ymin, ymax = [], 0, None, None, 0, 0
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    name = order[info.codepoint]
    b = BoundsPen(glyph_set)
    glyph_set[name].draw(b)
    gx0, gy0, gx1, gy1 = b.bounds
    if name == "k":
        body = (f'<path d="{STEM}"/><path d="{k_c()}" fill="none" stroke="currentColor" '
                f'stroke-width="{C_STROKE}"/>')
    else:
        pen = SVGPathPen(glyph_set)
        glyph_set[name].draw(pen)
        body = f'<path d="{pen.getCommands()}"/>'
    parts.append(f'<g transform="translate({x + pos.x_offset} 0)">{body}</g>')
    xmin = gx0 + x if xmin is None else min(xmin, gx0 + x)
    xmax = max(xmax or 0, gx1 + x)
    ymin, ymax = min(ymin, gy0), max(ymax, gy1)
    x += pos.x_advance

w, h = xmax - xmin, ymax - ymin
for file, colour in [("brand/wordmark.svg", "#18412d"), ("brand/wordmark-white.svg", "#ffffff")]:
    with open(file, "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{xmin:g} {-ymax:g} {w:g} {h:g}" '
                f'role="img" aria-label="{TEXT}"><title>{TEXT}</title>'
                f'<g fill="currentColor" color="{colour}" transform="scale(1 -1)">{"".join(parts)}</g></svg>\n')
print("viewBox", xmin, -ymax, w, h)
