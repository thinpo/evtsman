"""Star position calculator.

This module provides functions to calculate the apparent altitude and azimuth of a
star for a given observer location and time using basic astronomical formulas.
All angles are expected to be in degrees.
"""

from __future__ import annotations

from dataclasses import dataclass
from math import asin, atan2, cos, degrees, radians, sin, tan
import datetime as _dt


@dataclass
class HorizontalCoordinates:
    """Simple container for horizontal coordinates."""

    altitude: float  # degrees
    azimuth: float  # degrees


def _julian_day(dt: _dt.datetime) -> float:
    """Return the Julian Day for a datetime in UTC."""
    if dt.tzinfo is not None:
        dt = dt.astimezone(_dt.timezone.utc).replace(tzinfo=None)
    year, month = dt.year, dt.month
    day = dt.day + dt.hour / 24 + dt.minute / 1440 + dt.second / 86400
    if month <= 2:
        year -= 1
        month += 12
    A = year // 100
    B = 2 - A + A // 4
    jd = int(365.25 * (year + 4716)) + int(30.6001 * (month + 1)) + day + B - 1524.5
    return jd


def _greenwich_sidereal_time(jd: float) -> float:
    """Compute Greenwich Sidereal Time in degrees."""
    T = (jd - 2451545.0) / 36525
    gst = (
        280.46061837
        + 360.98564736629 * (jd - 2451545)
        + 0.000387933 * T ** 2
        - T ** 3 / 38710000
    )
    return gst % 360


def _local_sidereal_time(jd: float, longitude: float) -> float:
    """Local Sidereal Time for given longitude in degrees."""
    lst = _greenwich_sidereal_time(jd) + longitude
    return lst % 360


def _equatorial_to_horizontal(
    ra: float, dec: float, lat: float, lst: float
) -> HorizontalCoordinates:
    """Convert equatorial coordinates to horizontal coordinates."""
    H = (lst - ra) % 360
    # Convert to radians
    H_rad = radians(H)
    dec_rad = radians(dec)
    lat_rad = radians(lat)

    alt = asin(
        sin(dec_rad) * sin(lat_rad) + cos(dec_rad) * cos(lat_rad) * cos(H_rad)
    )
    az = atan2(
        -sin(H_rad),
        tan(dec_rad) * cos(lat_rad) - sin(lat_rad) * cos(H_rad),
    )
    return HorizontalCoordinates(degrees(alt), (degrees(az) + 360) % 360)


def calculate_star_position(
    ra: float, dec: float, latitude: float, longitude: float, dt: _dt.datetime
) -> HorizontalCoordinates:
    """Return the altitude and azimuth of a star.

    Args:
        ra: Right ascension of the star in degrees.
        dec: Declination of the star in degrees.
        latitude: Observer latitude in degrees (positive north).
        longitude: Observer longitude in degrees (positive east).
        dt: Observation time as a :class:`datetime.datetime` in UTC.

    Returns:
        :class:`HorizontalCoordinates` with altitude and azimuth in degrees.
    """
    jd = _julian_day(dt)
    lst = _local_sidereal_time(jd, longitude)
    return _equatorial_to_horizontal(ra, dec, latitude, lst)


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(
        description="Calculate apparent altitude and azimuth of a star."
    )
    parser.add_argument("ra", type=float, help="Right ascension (degrees)")
    parser.add_argument("dec", type=float, help="Declination (degrees)")
    parser.add_argument("latitude", type=float, help="Observer latitude (degrees)")
    parser.add_argument("longitude", type=float, help="Observer longitude (degrees)")
    parser.add_argument(
        "--datetime",
        type=str,
        default=None,
        help="Observation time in ISO format (UTC). Defaults to now.",
    )
    args = parser.parse_args()

    dt = (
        _dt.datetime.fromisoformat(args.datetime)
        if args.datetime
        else _dt.datetime.utcnow()
    )
    coords = calculate_star_position(args.ra, args.dec, args.latitude, args.longitude, dt)
    print(f"Altitude: {coords.altitude:.2f}°")
    print(f"Azimuth: {coords.azimuth:.2f}°")


if __name__ == "__main__":
    main()
