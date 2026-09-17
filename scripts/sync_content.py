#!/usr/bin/env python3
"""Import only the current Kief record. Historical exports are never imported."""
import argparse
import hashlib
import json
import re
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
SOURCES = {
    'kief-firelight-character.md': ('character', 'Character record'),
    'D&D 5.5e Rules Cheat Sheet.md': ('rules', 'Table rules'),
    'Draconic Sorcerer Playbook.md': ('playbook', 'The teammate playbook'),
    'mr-bigs-greatest-hits.md': ('familiar', 'Mr. Big’s field guide'),
    'kiefs-greatest-hits.md': ('greatest-hits', 'Kief’s greatest hits'),
    'dnd-beyond-todos.md': ('setup', 'Before session one'),
    'findings.md': ('checks', 'Campaign checks'),
    'update-plan.md': ('growth', 'The road to level six'),
}

def table(text, heading):
    section = text.split(heading, 1)[1].split('\n## ', 1)[0]
    return [[c.strip() for c in line.strip().strip('|').split('|')]
            for line in section.splitlines() if line.startswith('|')][2:]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=SITE.parent / 'kief')
    args = parser.parse_args()
    records = {name: (args.source / name).read_text() for name in SOURCES}
    char = records['kief-firelight-character.md']
    if 'Sorcerer 5' not in char or '**47 / 5d6**' not in char:
        raise SystemExit('Build changed: review dashboard numbers before importing.')
    generated = {}
    for filename, (route, title) in SOURCES.items():
        text = records[filename]
        text = re.sub(r'^# .+\n', '', text, count=1).lstrip()
        for source, (target, _) in SOURCES.items():
            text = text.replace(f']({source})', f'](/{target}/)')
            text = text.replace(f']({source.replace(" ", "%20")})', f'](/{target}/)')
        text = re.sub(r'\]\(archive/[^)]+\)', '](/history/)', text)
        generated[SITE / 'content' / f'{route}.md'] = ('+++\ntitle = ' + json.dumps(title) + '\n+++\n\n' + text)
    spells = []
    for name, source, job in table(char, '## Cantrips — 8 total'):
        spells.append(dict(name=name, source=source, level=0, concentration=False, job=job))
    for level, name, concentration, job in table(char, '## Sorcerer preparations — exactly 9'):
        spells.append(dict(name=name, source='Sorcerer preparation', level=int(level), concentration=concentration == 'Yes', job=job))
    extras = [
        ('Chromatic Orb', 1, False, 'Draconic Sorcery', 'Requires a 50+ GP diamond. Ownership is pending the campaign gear allowance.'),
        ('Command', 1, False, 'Draconic Sorcery', 'Interrupt a dangerous foe with a one-word command.'),
        ('Alter Self', 2, True, 'Draconic Sorcery', 'Adapt your appearance or body to the obstacle.'),
        ("Dragon’s Breath", 2, True, 'Draconic Sorcery', 'An alternative use of concentration; agree on the plan with the recipient.'),
        ('Fear', 3, True, 'Draconic Sorcery', 'Another control option when the situation suits fear.'),
        ('Fly', 3, True, 'Draconic Sorcery', 'Help an ally cross an obstacle; agree on a safe landing.'),
        ('Speak with Animals', 1, False, 'Forest Gnome', 'Three free casts per Long Rest, or slots/ritual. Animals know what animals perceive.'),
        ('Find Familiar', 1, False, 'Magic Initiate', 'One free cast per Long Rest, or slots/ritual. Still consumes 10+ GP incense; 1 hour, or 70 minutes as a ritual.'),
    ]
    for name, level, conc, source, job in extras:
        spells.append(dict(name=name, level=level, concentration=conc, source=source, job=job))
    generated[SITE / 'data' / 'spells.json'] = json.dumps(spells, indent=2) + '\n'
    if len(spells) != 25:
        raise SystemExit('Source structure changed; expected 25 spells.')
    manifest = {name: hashlib.sha256(text.encode()).hexdigest() for name, text in records.items()}
    generated[SITE / 'data' / 'sources.json'] = json.dumps(manifest, indent=2) + '\n'
    for destination, text in generated.items():
        destination.write_text(text)
    print(f'Imported {len(records)} current records and {len(spells)} spells.')

if __name__ == '__main__':
    main()
