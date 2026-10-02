#!/usr/bin/env python3
"""
Regenerates the Unicode normalization tables `String.prototype.normalize`
(ECMA-262 22.1.3.15, UAX #15) reads, in place, between the
`BEGIN/END GENERATED UNICODE NORMALIZATION TABLES` markers of
src/targets/cpp/runtime/gea_runtime.h.

    python3 scripts/generate-unicode-normalization.py

Python's `unicodedata` is the source because it is the one UCD on this machine
that exposes the three properties the algorithm needs -- the single-level
decomposition mapping, the canonical combining class, and (through its own
NFC) which canonical pairs are primary composites. node's ICU answers only
whole normalizations. The script refuses to run when the two disagree on the
Unicode version, so the tables always match what the oracle (node) computes.

The tables are three streams of unsigned integers, each packed as a
little-endian base-64 varint (6 bits per character: 1 continuation, 5 payload)
inside a string literal: tens of thousands of integers as brace-initialized
arrays would cost every program that includes the header their parse, while a
literal costs a lexer pass. The runtime decodes each stream once, on first use.
"""
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEADER = ROOT / 'src/targets/cpp/runtime/gea_runtime.h'
BEGIN = '// BEGIN GENERATED UNICODE NORMALIZATION TABLES'
END = '// END GENERATED UNICODE NORMALIZATION TABLES'
ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

node_unicode = subprocess.run(['node', '-p', 'process.versions.unicode'], capture_output=True, text=True, check=True).stdout.strip()
if not unicodedata.unidata_version.startswith(node_unicode):
    sys.exit(f'python unicodedata is Unicode {unicodedata.unidata_version}, node is {node_unicode}; refusing to generate mismatched tables')


def varints(values):
    out = []
    for value in values:
        assert value >= 0
        while True:
            chunk = value & 0x1F
            value >>= 5
            out.append(ALPHABET[chunk | (0x20 if value else 0)])
            if not value:
                break
    return ''.join(out)


def is_hangul_syllable(cp):
    return 0xAC00 <= cp <= 0xD7A3


decompositions = []  # (cp, compat, mapping)
combining = []  # (cp, ccc)
for cp in range(0x110000):
    if 0xD800 <= cp <= 0xDFFF:
        continue
    ch = chr(cp)
    ccc = unicodedata.combining(ch)
    if ccc:
        combining.append((cp, ccc))
    if is_hangul_syllable(cp):
        continue  # decomposed algorithmically (UAX #15 / Unicode 3.12)
    raw = unicodedata.decomposition(ch)
    if not raw:
        continue
    compat = raw.startswith('<')
    parts = raw.split(' ')[1:] if compat else raw.split(' ')
    decompositions.append((cp, compat, [int(part, 16) for part in parts]))

# A primary composite is a character with a two-element canonical mapping that
# NFC keeps as itself: that excludes exactly the composition exclusions,
# singletons and non-starter decompositions (UAX #15 X3, D114).
compositions = []
for cp, compat, mapping in decompositions:
    if compat or len(mapping) != 2:
        continue
    if unicodedata.normalize('NFC', unicodedata.normalize('NFD', chr(cp))) == chr(cp):
        compositions.append((mapping[0], mapping[1], cp))

decomposition_stream = [len(decompositions)]
previous = 0
for cp, compat, mapping in decompositions:
    decomposition_stream += [cp - previous, (len(mapping) << 1) | (1 if compat else 0), *mapping]
    previous = cp

# Combining classes as runs of consecutive code points sharing one class.
runs = []
for cp, ccc in combining:
    if runs and runs[-1][0] + runs[-1][1] == cp and runs[-1][2] == ccc:
        runs[-1][1] += 1
    else:
        runs.append([cp, 1, ccc])
combining_stream = [len(runs)]
previous = 0
for start, length, ccc in runs:
    combining_stream += [start - previous, length, ccc]
    previous = start

composition_stream = [len(compositions)]
for first, second, composite in compositions:
    composition_stream += [first, second, composite]


def literal(name, values):
    text = varints(values)
    lines = [text[i : i + 120] for i in range(0, len(text), 120)]
    body = '\n'.join(f'    "{line}"' for line in lines)
    return f'inline constexpr const char {name}[] =\n{body};'


generated = '\n'.join(
    [
        BEGIN,
        f'// Unicode {unicodedata.unidata_version}: {len(decompositions)} decompositions, {len(runs)} combining-class runs,',
        f'// {len(compositions)} primary composites. Regenerate with scripts/generate-unicode-normalization.py.',
        literal('decompositionStream', decomposition_stream),
        literal('combiningClassStream', combining_stream),
        literal('compositionStream', composition_stream),
        END,
    ]
)

source = HEADER.read_text()
pattern = re.compile(re.escape(BEGIN) + r'.*?' + re.escape(END), re.S)
if not pattern.search(source):
    sys.exit(f'{HEADER} has no {BEGIN} ... {END} region to fill')
HEADER.write_text(pattern.sub(lambda _: generated, source, count=1))
print(f'wrote {len(generated)} bytes of tables into {HEADER.relative_to(ROOT)}')
