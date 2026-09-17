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
    'rules-arbitration.md': ('rulings', 'Table rulings and open decisions'),
}

def table(text, heading):
    section = text.split(heading, 1)[1].split('\n## ', 1)[0]
    return [[c.strip() for c in line.strip().strip('|').split('|')]
            for line in section.splitlines() if line.startswith('|')][2:]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=SITE.parent / 'kief')
    parser.add_argument('--check', action='store_true', help='Report drift without writing files')
    args = parser.parse_args()
    records = {name: (args.source / name).read_text() for name in SOURCES}
    char = records['kief-firelight-character.md']
    expected = ('Sorcerer 5', '**47 / 5d6**', '**15** unarmored; **20**',
                '**DC 14 / +6**', '**DC 15 / advantage**', '**5 SP / 4 first, 3 second, 2 third**',
                '| Constitution | 18 | +4 | +7 |', '| Initiative / speed | +2 / 30 feet |',
                '| Innate Sorcery | 2 uses per Long Rest |', 'up to **2 spent SP**')
    if any(value not in char for value in expected):
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
    reference_text = (args.source / 'spell-reference.json').read_text()
    references = json.loads(reference_text)
    by_name = {item['name']: item for item in references}
    if len(by_name) != 25 or len(references) != 25 or set(by_name) != {s['name'] for s in spells}:
        raise SystemExit('Spell reference must match the 25 character spells exactly.')
    required = ('casting', 'range', 'target', 'components', 'duration', 'resolution', 'effect', 'higher', 'caution', 'rules_url', 'checked')
    for spell in spells:
        detail = by_name[spell['name']]
        if any(not isinstance(detail.get(key), str) or not detail[key].strip() for key in required):
            raise SystemExit(f'Incomplete spell reference: {spell["name"]}')
        if not detail['rules_url'].startswith('https://'):
            raise SystemExit('Rules references must use HTTPS.')
        spell.update({key: detail[key] for key in required})
    generated[SITE / 'data' / 'spells.json'] = json.dumps(spells, indent=2, ensure_ascii=False) + '\n'
    generated[SITE / 'docs' / 'rules-arbitration.md'] = records['rules-arbitration.md']
    manifest = {name: hashlib.sha256(text.encode()).hexdigest() for name, text in records.items()}
    manifest['spell-reference.json'] = hashlib.sha256(reference_text.encode()).hexdigest()
    generated[SITE / 'data' / 'sources.json'] = json.dumps(manifest, indent=2) + '\n'
    if args.check:
        drift = [str(path.relative_to(SITE)) for path, text in generated.items() if not path.exists() or path.read_text() != text]
        if drift:
            raise SystemExit('Source drift: ' + ', '.join(drift))
        print(f'In sync: {len(records)} records, 25 spell references, and source fingerprints.')
        return
    for destination, text in generated.items():
        destination.write_text(text)
    print(f'Imported {len(records)} current records and {len(spells)} spells.')

if __name__ == '__main__':
    main()
