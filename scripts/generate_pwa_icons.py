from __future__ import annotations

import math
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"

BASE_SIZE = 1024
BACKGROUND = (6, 4, 16, 255)


def lerp_color(start: tuple[int, int, int], end: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(s + (e - s) * t) for s, e in zip(start, end))


def create_vertical_gradient(
    size: tuple[int, int],
    top_color: tuple[int, int, int],
    bottom_color: tuple[int, int, int],
) -> Image.Image:
    width, height = size
    gradient = Image.new("RGBA", size)
    pixels = gradient.load()

    for y in range(height):
        t = y / max(height - 1, 1)
        color = lerp_color(top_color, bottom_color, t)
        for x in range(width):
            pixels[x, y] = (*color, 255)

    return gradient


def draw_glow_line(
    canvas: Image.Image,
    points: Iterable[tuple[float, float]],
    color: tuple[int, int, int, int],
    width: int,
    blur: int,
) -> None:
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.line(list(points), fill=color, width=width, joint="curve")
    blurred = layer.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(blurred)


def create_icon() -> Image.Image:
    canvas = Image.new("RGBA", (BASE_SIZE, BASE_SIZE), BACKGROUND)

    vignette = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    vignette_draw = ImageDraw.Draw(vignette)
    vignette_draw.ellipse(
        (-140, -80, BASE_SIZE + 160, BASE_SIZE + 200),
        fill=(18, 10, 48, 110),
    )
    vignette_draw.ellipse(
        (120, 40, BASE_SIZE - 100, BASE_SIZE - 120),
        fill=(24, 18, 72, 120),
    )
    vignette = vignette.filter(ImageFilter.GaussianBlur(70))
    canvas.alpha_composite(vignette)

    circle_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    circle_draw = ImageDraw.Draw(circle_layer)
    circle_draw.ellipse((110, 110, 914, 914), fill=(5, 3, 18, 255))
    circle_layer = circle_layer.filter(ImageFilter.GaussianBlur(2))
    canvas.alpha_composite(circle_layer)

    panel_bounds = (270, 230, 760, 760)
    panel_width = panel_bounds[2] - panel_bounds[0]
    panel_height = panel_bounds[3] - panel_bounds[1]

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (250, 210, 780, 780),
        radius=100,
        fill=(89, 56, 255, 55),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    canvas.alpha_composite(shadow)

    panel_mask = Image.new("L", (panel_width, panel_height), 0)
    panel_mask_draw = ImageDraw.Draw(panel_mask)
    panel_mask_draw.rounded_rectangle((0, 0, panel_width, panel_height), radius=96, fill=255)

    panel_gradient = create_vertical_gradient(
        (panel_width, panel_height),
        (46, 118, 255),
        (23, 15, 58),
    )
    panel_gradient.putalpha(panel_mask)
    canvas.alpha_composite(panel_gradient, dest=(panel_bounds[0], panel_bounds[1]))

    panel_highlight = Image.new("RGBA", (panel_width, panel_height), (0, 0, 0, 0))
    highlight_draw = ImageDraw.Draw(panel_highlight)
    highlight_draw.rounded_rectangle(
        (10, 10, panel_width - 10, panel_height - 10),
        radius=88,
        outline=(145, 210, 255, 110),
        width=7,
    )
    highlight_draw.rounded_rectangle(
        (18, 18, panel_width - 18, panel_height - 18),
        radius=80,
        outline=(160, 115, 255, 55),
        width=3,
    )
    canvas.alpha_composite(panel_highlight, dest=(panel_bounds[0], panel_bounds[1]))

    blob_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    blob_draw = ImageDraw.Draw(blob_layer)
    blob_draw.ellipse((560, 330, 860, 700), fill=(255, 96, 142, 145))
    blob_draw.ellipse((520, 460, 900, 860), fill=(196, 52, 171, 90))
    blob_layer = blob_layer.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(blob_layer)

    points_main = []
    points_cyan = []
    points_violet = []
    for step in range(0, 101):
        t = step / 100
        x = 250 + t * 560
        y_main = 565 - 105 * math.sin(t * 3.1 * math.pi) - 20 * math.sin(t * 7.1 * math.pi)
        y_cyan = 575 - 90 * math.sin((t + 0.03) * 3.0 * math.pi)
        y_violet = 555 - 135 * math.sin((t - 0.08) * 2.4 * math.pi)
        points_main.append((x, y_main))
        points_cyan.append((x, y_cyan))
        points_violet.append((x, y_violet))

    draw_glow_line(canvas, points_cyan, (78, 237, 255, 120), 28, 22)
    draw_glow_line(canvas, points_violet, (191, 117, 255, 120), 28, 22)
    draw_glow_line(canvas, points_main, (255, 255, 255, 150), 24, 18)
    draw_glow_line(canvas, points_cyan, (99, 248, 255, 255), 12, 4)
    draw_glow_line(canvas, points_violet, (208, 126, 255, 255), 12, 4)
    draw_glow_line(canvas, points_main, (255, 255, 255, 230), 10, 2)

    return canvas


def save_sizes(base_icon: Image.Image) -> None:
    targets = {
        "icon-512.png": 512,
        "maskable-icon-512.png": 512,
        "icon-192.png": 192,
        "apple-touch-icon.png": 180,
    }

    for filename, size in targets.items():
        icon = base_icon.resize((size, size), Image.LANCZOS)
        icon.save(PUBLIC_DIR / filename)


def main() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    icon = create_icon()
    save_sizes(icon)


if __name__ == "__main__":
    main()
