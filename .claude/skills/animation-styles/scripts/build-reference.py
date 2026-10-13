"""Build references/styles.md from the header comment at the top of each demo.

    python3 scripts/build-reference.py

The demo files are the single source: each opens with a comment block of
FIELD: value lines (STYLE, LOOK, BEST FOR, AVOID WHEN, PAIRS WITH, TECHNIQUE,
KNOBS, COST, REDUCED MOTION, PITFALLS). Edit a demo's header, then rerun this,
so the notes can never drift from the code. Fails loudly if a field is missing.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEMOS = ROOT / 'assets' / 'demos'
OUT = ROOT / 'references' / 'styles.md'
FIELDS = ['STYLE', 'LOOK', 'BEST FOR', 'AVOID WHEN', 'PAIRS WITH', 'TECHNIQUE', 'KNOBS', 'COST', 'REDUCED MOTION', 'PITFALLS']
SHOWN = [('Looks like', 'LOOK'), ('Best for', 'BEST FOR'), ('Avoid when', 'AVOID WHEN'), ('Pairs with', 'PAIRS WITH'),
         ('Technique', 'TECHNIQUE'), ('Knobs', 'KNOBS'), ('Cost', 'COST'), ('Reduced motion', 'REDUCED MOTION'), ('Pitfalls', 'PITFALLS')]


def header(path):
    text = path.read_text(encoding='utf-8')
    m = re.search(r'<!--\n(.*?)-->', text, re.S)
    if not m:
        sys.exit(f'{path.name}: no header comment')
    found = {}
    pattern = r'^(' + '|'.join(re.escape(f) for f in FIELDS) + r'): (.*?)(?=^(?:' + '|'.join(re.escape(f) for f in FIELDS) + r'): |\Z)'
    for k, v in re.findall(pattern, m.group(1), re.S | re.M):
        found[k] = ' '.join(v.split())
    missing = [f for f in FIELDS if f not in found]
    if missing:
        sys.exit(f'{path.name}: header is missing {", ".join(missing)}')
    return found


def main():
    demos = sorted(DEMOS.glob('[0-9][0-9]-*.html'))
    if len(demos) != 20:
        print(f'note: {len(demos)} demos found (expected 20)', file=sys.stderr)
    entries = [(p, header(p)) for p in demos]
    lines = [
        '# Style notes',
        '',
        'Generated from the header of each demo by `scripts/build-reference.py`; edit the',
        'demo header and rerun it rather than editing this file. Each entry: what it looks',
        'like, when to use it and when not, what to pair it with, how it works, the values',
        'to tune, what it costs, what reduced motion shows, and what makes it look cheap.',
        '',
        '## Contents',
        '',
    ]
    for p, h in entries:
        n = p.name[:2]
        anchor = f'{n}-' + re.sub(r'[^a-z0-9]+', '-', h['STYLE'].lower()).strip('-')
        lines.append(f'- [{n} {h["STYLE"]}](#{anchor})')
    for p, h in entries:
        lines += ['', f'## {p.name[:2]} {h["STYLE"]}', '', f'Demo: `assets/demos/{p.name}` · still: `assets/demos/thumbs/{p.stem}.jpg`', '']
        for label, key in SHOWN:
            lines.append(f'- **{label}:** {h[key]}')
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'wrote {OUT.relative_to(ROOT)} ({len(entries)} styles, {len(lines)} lines)')


if __name__ == '__main__':
    main()
