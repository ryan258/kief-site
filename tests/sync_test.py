"""Targeted importer contract tests; fixtures use checked-in data, no sibling checkout needed."""
import contextlib
import importlib.util
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('sync_content', ROOT / 'scripts/sync_content.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

class ImportContract(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.site = Path(self.temp.name) / 'site'
        self.source = Path(self.temp.name) / 'source'
        self.source.mkdir()
        for folder in ('content', 'data', 'docs'):
            (self.site / folder).mkdir(parents=True)
        for filename, (route, _) in sync.SOURCES.items():
            text = (ROOT / 'content' / f'{route}.md').read_text().split('+++', 2)[2].lstrip()
            (self.source / filename).write_text(text)
        (self.source / 'spell-reference.json').write_text((ROOT / 'data/spells.json').read_text())

    def run_import(self, *args):
        with patch.object(sync, 'SITE', self.site), patch.object(sys, 'argv', ['sync', '--source', str(self.source), *args]), contextlib.redirect_stdout(io.StringIO()):
            sync.main()

    def test_roundtrip_and_check_report_output_drift_without_writing(self):
        self.run_import()
        self.run_import('--check')
        output = self.site / 'content/character.md'
        output.write_text('manual drift')
        with self.assertRaisesRegex(SystemExit, 'Source drift: content/character.md'):
            self.run_import('--check')
        self.assertEqual(output.read_text(), 'manual drift')

    def test_changed_build_fails_before_writing(self):
        char = self.source / 'kief-firelight-character.md'
        char.write_text(char.read_text().replace('**DC 14 / +6**', '**DC 15 / +7**'))
        with self.assertRaisesRegex(SystemExit, 'Build changed'):
            self.run_import()
        self.assertEqual(list((self.site / 'content').iterdir()), [])

    def test_incomplete_or_duplicate_spell_reference_fails_before_writing(self):
        path = self.source / 'spell-reference.json'
        original = json.loads(path.read_text())
        broken = json.loads(path.read_text()); del broken[0]['components']
        for data in (broken, original + [original[0]]):
            path.write_text(json.dumps(data))
            with self.assertRaises(SystemExit): self.run_import()
            self.assertEqual(list((self.site / 'data').iterdir()), [])

if __name__ == '__main__':
    unittest.main()
