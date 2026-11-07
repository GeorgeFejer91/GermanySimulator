"""Waltraud-owned LEFT sixteen-key field PREP; no image loading or writes on import."""
import math


def planted_curve(p):
    p = p % 1
    if .25 <= p <= .75:
        return 2 - 4 * p
    q = ((p - .75) % 1) * 2
    return -1 - 2 * q + 12 * q * q - 8 * q * q * q


def make_field(controls, key, foot):
    import numpy as np
    from scipy.interpolate import PchipInterpolator

    assert isinstance(key, int) and 0 <= key < 16 and foot in ('near', 'far')
    p = key / 16 + (.5 if foot == 'far' else 0)
    dx = controls['travelSign'] * controls['horizontalAmplitude'] * planted_curve(p)
    dy = -controls['swingLift'] * max(0, math.cos(math.tau * p))
    # Exact trigonometric quadrants are the intended four source keys.
    dx = 0.0 if abs(dx) < 1e-12 else dx
    dy = 0.0 if abs(dy) < 1e-12 else dy
    if key in controls['phasesOf16']:
        assert dx == round(dx) and dy == round(dy)
    root = controls['zeroDisplacementThroughY']
    plateau = controls['rigidWholeCuffBootFromY']
    nodes = controls[foot + 'FieldNodesY']
    assert all(b > a for a, b in zip(nodes, nodes[1:]))
    assert root in nodes and plateau in nodes
    weights = []
    for y in nodes:
        t = max(0, min(1, (y - root) / (plateau - root)))
        weights.append(t * t * (3 - 2 * t))
    xs = [dx * w for w in weights]
    ys = [dy * w for w in weights]
    xf = PchipInterpolator(nodes, xs)
    yf = PchipInterpolator(nodes, ys)
    dense = np.linspace(0, 511, 4097)
    jac = 1 + yf.derivative()(dense)
    assert jac.min() > .5
    stationary = np.linspace(0, root, 1025)
    assert np.max(np.abs(xf(stationary))) == 0
    assert np.max(np.abs(yf(stationary))) == 0
    rigid = np.linspace(plateau, 511, 1025)
    assert np.max(np.abs(xf(rigid) - dx)) < 1e-10
    assert np.max(np.abs(yf(rigid) - dy)) < 1e-10
    target = np.arange(512, dtype=float)
    inverse = target.copy()
    for _ in range(10):
        inverse = target - yf(np.clip(inverse, 0, 511))
    residual = np.max(np.abs(inverse + yf(np.clip(inverse, 0, 511)) - target))
    assert residual < 1e-7
    return {'nodes_y': nodes, 'dx': xs, 'dy': ys,
            'footDxDy': [dx, dy],
            'minimumVerticalJacobian': float(jac.min()),
            'inverseResidualMaximum': float(residual),
            'stationaryThroughY': root, 'wholeFootRigidFromY': plateau}
