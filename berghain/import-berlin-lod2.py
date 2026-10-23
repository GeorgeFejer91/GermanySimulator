"""Extract the identified public Berlin building; no GIS dependency required.

Inputs are research-only downloads. The generated module contains only this
building's generalised exterior, in metres, with source hashes and coordinates.
"""
import hashlib
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DOWNLOADS = ROOT / 'berghain/references/downloads'
BUILDING_ID = 'DEBE02YY200004SX'
GML = '{http://www.opengis.net/gml}'
BUILDING = '{http://www.opengis.net/citygml/building/1.0}'
GENERIC = '{http://www.opengis.net/citygml/generics/1.0}'
NS = {'w': 'http://www.opengis.net/wfs/2.0', 'a': 'alkis_gebaeude',
      'g': 'http://www.opengis.net/gml/3.2'}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    archive = DOWNLOADS / 'LoD2_394_5819.zip'
    cadastral = DOWNLOADS / 'alkis-berghain.gml'
    with zipfile.ZipFile(archive) as source:
        document = ET.fromstring(source.read('LoD2_33_394_5819_1_BE.xml'))
    building = next(item for item in document.iter(BUILDING + 'Building')
                    if item.get(GML + 'id') == BUILDING_ID)
    records = ET.parse(cadastral).getroot()
    record = next(item for item in records.findall('w:member/a:gebaeude', NS)
                  if item.findtext('a:uuid', namespaces=NS) == BUILDING_ID)
    assert record.findtext('a:namlag', namespaces=NS) == 'Rüdersdorfer Straße 70'
    feed = ET.parse(DOWNLOADS / 'lod2-atom.xml').getroot()
    rights = feed.findtext('{http://www.w3.org/2005/Atom}rights')
    assert rights and 'Datenlizenz Deutschland' in rights and 'Zero' in rights and '2.0' in rights

    # Endpoints of the front cadastral edge, retained exactly from the WFS.
    front_left = (394318.997, 5819031.864)
    front_right = (394349.713, 5819009.577)
    cadastral_points = list(map(float, record.find('.//g:posList', NS).text.split()))
    cadastral_points = list(zip(cadastral_points[::2], cadastral_points[1::2]))
    assert front_left in cadastral_points and front_right in cadastral_points
    width = math.dist(front_left, front_right)
    axis = tuple((right - left) / width for left, right in zip(front_left, front_right))
    origin = [(left + right) / 2 for left, right in zip(front_left, front_right)] + [35.288]

    def coordinates(element):
        values = list(map(float, element.text.split()))
        assert len(values) % 3 == 0
        points = []
        for east, north, altitude in zip(values[::3], values[1::3], values[2::3]):
            de, dn = east - origin[0], north - origin[1]
            points.append([round(de * axis[0] + dn * axis[1], 6),
                           round(altitude - origin[2], 6),
                           round(22 + de * axis[1] - dn * axis[0], 6)])
        if points[0] == points[-1]:
            points.pop()
        assert len(points) >= 3
        return points

    parts = []
    for part in building.iter(BUILDING + 'BuildingPart'):
        surfaces = []
        for boundary in part.findall(BUILDING + 'boundedBy'):
            surface = next(iter(boundary))
            polygons = []
            for polygon in surface.iter(GML + 'Polygon'):
                outer = polygon.find('.//' + GML + 'exterior//' + GML + 'posList')
                holes = polygon.findall('.//' + GML + 'interior//' + GML + 'posList')
                polygons.append({'outer': coordinates(outer), 'holes': [coordinates(hole) for hole in holes]})
            surfaces.append({'type': surface.tag.split('}')[-1], 'polygons': polygons})
        attributes = {item.get('name'): item.findtext(GENERIC + 'value')
                      for item in part.findall(GENERIC + 'stringAttribute')}
        parts.append({'id': part.get(GML + 'id'),
                      'measuredHeight': float(part.findtext(BUILDING + 'measuredHeight')),
                      'footprintDate': attributes.get('Grundrissaktualitaet'),
                      'sourceAttributes': attributes, 'surfaces': surfaces})

    survey = {
        'buildingId': BUILDING_ID, 'address': 'Rüdersdorfer Straße 70, Berlin',
        'licence': 'dl-de-zero-2.0', 'licenceURL': 'https://www.govdata.de/dl-de/zero-2-0',
        'provider': 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen Berlin',
        'retrieved': records.get('timeStamp')[:10],
        'creationDate': building.findtext('{http://www.opengis.net/citygml/1.0}creationDate'),
        'cadastralArea': float(record.findtext('a:shape_area', namespaces=NS)),
        'cadastralCapture': record.findtext('a:bezdes', namespaces=NS),
        'frontage': width, 'units': 'metres',
        'frame': {'horizontalCRS': 'EPSG:25833', 'origin': origin, 'xAxisEastNorth': axis,
                  'frontZ': 22, 'heightNote': 'Source altitudes minus 35.288 m ground-surface datum; vertical datum not independently established.'},
        'sources': [
            {'url': 'https://gdi.berlin.de/data/a_lod2/atom/LoD2_394_5819.zip', 'sha256': digest(archive)},
            {'url': 'https://gdi.berlin.de/services/wfs/alkis_gebaeude', 'query': 'WFS 2.0 GetFeature; typeNames=alkis_gebaeude:gebaeude; srsName=EPSG:25833; bbox=52.5107,13.4424,52.5125,13.4448,urn:ogc:def:crs:EPSG::4326; count=100', 'sha256': digest(cadastral)},
            {'url': 'https://gdi.berlin.de/data/a_lod2/atom/', 'sha256': digest(DOWNLOADS / 'lod2-atom.xml')}
        ],
        'limits': 'Generalised LoD2 exterior with no windows, wall thickness, interior, equipment or texture. Cadastral classification Heizwerk is a legacy function, not present-day venue use.',
        'parts': parts
    }
    destination = ROOT / 'assets/models/berghain/survey-data.mjs'
    destination.write_text('// Generated by berghain/import-berlin-lod2.py. Berlin open data; dl-de-zero-2.0.\nexport const survey = ' + json.dumps(survey, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    print(json.dumps({'buildingId': BUILDING_ID, 'parts': len(parts), 'frontage': width,
                      'cadastralArea': survey['cadastralArea'], 'bytes': destination.stat().st_size}))


if __name__ == '__main__':
    main()
