"""Project the current flat catalog into the compact tree used by page 08.

Keep catalog dictionary IDs alongside tree indices so links into page 11
refer to the same authors and epochs, even after attribution corrections.
"""


def map_data(catalog):
    d, t = catalog['dict'], catalog['t']
    data = {'sup': [['Академическая', 0], ['Повседневная', 0]],
            'sub': [], 'gal': [], 'sys': [], 'trk': []}
    galaxies, systems, subgenres = {}, {}, {}
    for i, name in enumerate(t['n']):
        realm = 0 if t['R'][i] else 1
        epoch_id, artist_id = t['e'][i], t['a'][i]
        epoch = d['epoch'][epoch_id]
        gkey = (realm, epoch_id)
        if gkey not in galaxies:
            galaxies[gkey] = len(data['gal'])
            data['gal'].append([epoch['n'], realm, epoch['lo'], 0, epoch_id])
        gi = galaxies[gkey]
        sub = d['dir'][t['d'][i]] if realm == 0 else d['sub'][t['s'][i]]
        if sub not in subgenres:
            subgenres[sub] = len(data['sub'])
            data['sub'].append(sub)
        skey = (gi, artist_id, sub)
        if skey not in systems:
            systems[skey] = len(data['sys'])
            data['sys'].append([d['artist'][artist_id], gi, subgenres[sub], 0, artist_id])
        si = systems[skey]
        data['sup'][realm][1] += 1
        data['gal'][gi][3] += 1
        data['sys'][si][3] += 1
        data['trk'].append([name, si, t['y'][i], t['r'][i]])
    return data
