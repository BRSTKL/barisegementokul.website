# Implementation Notes

## SVG path data

- Never use percentage values inside an SVG `path` `d` attribute.
- `d` must contain numeric coordinates, so use a `viewBox` and calculate real numbers such as `M 20 0 L 30 50 L 20 100`.
- Percentages are valid for some SVG attributes like gradient offsets, but not for path commands.

## Open-Meteo climate API

- For climate data, use `https://climate-api.open-meteo.com/v1/climate`.
- Use `start_date` and `end_date` in `YYYY-MM-DD` format, not `start_year` or `end_year`.
- Example:

```text
https://climate-api.open-meteo.com/v1/climate?latitude=52.52&longitude=13.41&start_date=2018-01-01&end_date=2022-12-31&daily=shortwave_radiation_sum&models=EC_Earth3P_HR
```
