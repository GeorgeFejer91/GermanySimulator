"""Transport Renate's inspected lips through the displayed source upper field.

Paint132 is a source sampling scale; nominal figure136 still owns world size.
Only source/CPU evidence is produced here. The GLSL axes are column ordered.
"""
import numpy as np
from scipy.interpolate import PchipInterpolator

LOGICAL_SCALE = 132 / 400


def mapper(field):
    ys, dx, dy = (np.asarray(field[key], float) for key in ('nodes_y', 'dx', 'dy'))
    if (field['sourceSize'] != [512, 512] or len(ys) < 2 or len(ys) > 16
            or dx.shape != ys.shape or dy.shape != ys.shape
            or ys[0] != 0 or ys[-1] != 511 or not np.all(np.diff(ys) > 0)
            or not np.all(np.isfinite([*ys, *dx, *dy]))):
        raise ValueError('Invalid actual Renate upper field')
    fx, fy = PchipInterpolator(ys, dx), PchipInterpolator(ys, dy)

    def mapped(points):
        points = np.asarray(points, float)
        if points.ndim != 2 or points.shape[1] != 2 or not np.all(np.isfinite(points)):
            raise ValueError('Invalid source points')
        return points + np.column_stack([fx(points[:, 1]), fy(points[:, 1])])

    return mapped


def logical(points):
    return (np.asarray(points, float) - [256, 472]) * LOGICAL_SCALE + [64, 150]


def transport(entry, compiled, field):
    mapped = mapper(field)
    center = np.asarray(entry['centerPx']) - entry.get('cellOriginPx', [0, 0])
    axes = np.asarray(entry['axesPx'], float).reshape(2, 2).T
    anchors = np.vstack([center, center + axes[:, 0], center + axes[:, 1]])
    moved = mapped(anchors)
    moved_axes = (moved[1:] - moved[0]).T
    if np.linalg.det(moved_axes) <= 0:
        raise ValueError('Folded Renate lip frame')
    xx, yy = np.meshgrid(np.linspace(-2, 2, 33), np.linspace(-1.6, 3, 33))
    local = np.column_stack([xx.ravel(), yy.ravel()])
    support = center + local @ axes.T
    residual = float(np.max(np.linalg.norm(mapped(support) - (moved[0] + local @ moved_axes.T), axis=1)))
    if residual > .1:
        raise ValueError('Lip support is not sufficiently affine: ' + str(residual))
    destination = logical(moved[0])
    tangent, normal = (moved_axes * LOGICAL_SCALE).T
    result = {
        'rect': [float(destination[0] / 128), float(1 - destination[1] / 160),
                 float(np.linalg.norm(tangent) / 128), float(np.linalg.norm(normal) / 160)],
        'axes': [float(tangent[0]), float(tangent[1]), float(normal[0]), float(normal[1])],
        'profile': compiled['profile']}
    moved_entry = {
        'centerPx': moved[0].tolist(), 'axesPx': moved_axes.T.reshape(-1).tolist(),
        'contoursPx': {key: mapped(np.asarray(points) - entry.get('cellOriginPx', [0, 0])).tolist()
                       for key, points in entry['contoursPx'].items()},
        'cell': [512, 512], 'cellOriginPx': [0, 0], 'width': entry['width'], 'teeth': entry['teeth']}
    proof = {'sourceAnchors': anchors.tolist(), 'movedAnchors': moved.tolist(),
             'logicalAnchors': logical(moved).tolist(), 'shaderSupportGrid': [33, 33],
             'maximumAffineResidualWorkingPx': residual,
             'paintScaleCanonical': 132, 'nominalWorldFigure': 136}
    return result, moved_entry, proof
