"""Check every map record against the canonical catalog, including attribution."""
import json
import re
from collections import Counter
from pathlib import Path
from map_data import map_data

root = Path(__file__).resolve().parents[1]
catalog = json.loads((root / 'data/catalog.json').read_text(encoding='utf-8'))
tree = map_data(catalog)
t, d = catalog['t'], catalog['dict']
assert len(tree['trk']) == len(t['n'])
systems, galaxies, realms = Counter(), Counter(), Counter()
for i, track in enumerate(tree['trk']):
    name, si, year, rank = track
    system = tree['sys'][si]
    galaxy = tree['gal'][system[1]]
    assert (name, year, rank) == (t['n'][i], t['y'][i], t['r'][i])
    assert system[4] == t['a'][i]
    assert system[0] == d['artist'][t['a'][i]]
    assert galaxy[4] == t['e'][i]
    assert galaxy[1] == (0 if t['R'][i] else 1)
    assert galaxy[2] == d['epoch'][t['e'][i]]['lo']
    systems[si] += 1
    galaxies[system[1]] += 1
    realms[galaxy[1]] += 1
assert all(row[3] == systems[i] for i, row in enumerate(tree['sys']))
assert all(row[3] == galaxies[i] for i, row in enumerate(tree['gal']))
assert all(row[1] == realms[i] for i, row in enumerate(tree['sup']))
page = (root / 'src/08-cosmos.html').read_text(encoding='utf-8')
assert json.loads(re.search(r'var DATA=(.*?);\n', page).group(1)) == tree
print(f"PASS: all {len(tree['trk'])} map records match catalog; "
      f"{len(tree['gal'])} genre/epoch groups; counts and author links agree")
