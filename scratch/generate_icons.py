import os
from PIL import Image, ImageDraw, ImageFont

DENSITIES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

BASE_DIR = '/home/karann/Documents/ERP/SchoolERP'

def draw_squircle_mask(size, radius):
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=255)
    return mask

def draw_circle_mask(size):
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([(0, 0), (size - 1, size - 1)], fill=255)
    return mask

def create_edu_icon(size, is_round=False):
    scale = 4
    s = size * scale
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    top_color = (15, 23, 42)
    mid_color = (30, 64, 175)
    bottom_color = (2, 132, 199)
    
    for y in range(s):
        ratio = y / s
        if ratio < 0.5:
            t = ratio * 2
            r = int(top_color[0] * (1 - t) + mid_color[0] * t)
            g = int(top_color[1] * (1 - t) + mid_color[1] * t)
            b = int(top_color[2] * (1 - t) + mid_color[2] * t)
        else:
            t = (ratio - 0.5) * 2
            r = int(mid_color[0] * (1 - t) + bottom_color[0] * t)
            g = int(mid_color[1] * (1 - t) + bottom_color[1] * t)
            b = int(mid_color[2] * (1 - t) + bottom_color[2] * t)
        draw.line([(0, y), (s, y)], fill=(r, g, b, 255))

    margin = int(s * 0.04)
    draw.rounded_rectangle([(margin, margin), (s - margin, s - margin)], radius=int(s * 0.22), outline=(56, 189, 248, 120), width=int(s * 0.015))

    cx = s / 2
    cap_y = s * 0.32
    cap_w = s * 0.52
    cap_h = s * 0.22
    cap_polygon = [
        (cx, cap_y - cap_h / 2),
        (cx + cap_w / 2, cap_y),
        (cx, cap_y + cap_h / 2),
        (cx - cap_w / 2, cap_y)
    ]
    draw.polygon(cap_polygon, fill=(255, 255, 255, 255))
    
    skull_top = cap_y + s * 0.03
    skull_bottom = cap_y + s * 0.12
    draw.polygon([
        (cx - s * 0.16, skull_top),
        (cx + s * 0.16, skull_top),
        (cx + s * 0.12, skull_bottom),
        (cx - s * 0.12, skull_bottom)
    ], fill=(56, 189, 248, 255))

    draw.line([(cx, cap_y), (cx + cap_w * 0.45, cap_y + s * 0.08), (cx + cap_w * 0.45, cap_y + s * 0.18)], fill=(251, 191, 36, 255), width=max(1, int(s * 0.018)))
    draw.ellipse([(cx + cap_w * 0.45 - s * 0.02, cap_y + s * 0.18), (cx + cap_w * 0.45 + s * 0.02, cap_y + s * 0.22)], fill=(245, 158, 11, 255))

    book_y = s * 0.50
    book_w = s * 0.42
    draw.polygon([
        (cx - s * 0.01, book_y + s * 0.06),
        (cx - book_w / 2, book_y),
        (cx - book_w / 2, book_y + s * 0.12),
        (cx - s * 0.01, book_y + s * 0.16)
    ], fill=(224, 242, 254, 255))
    draw.polygon([
        (cx + s * 0.01, book_y + s * 0.06),
        (cx + book_w / 2, book_y),
        (cx + book_w / 2, book_y + s * 0.12),
        (cx + s * 0.01, book_y + s * 0.16)
    ], fill=(186, 230, 253, 255))

    badge_w = s * 0.62
    badge_h = s * 0.20
    badge_x1 = int(cx - badge_w / 2)
    badge_y1 = int(s * 0.70)
    badge_x2 = int(cx + badge_w / 2)
    badge_y2 = int(badge_y1 + badge_h)

    b_rad = int(badge_h * 0.35)
    draw.rounded_rectangle([(badge_x1, badge_y1), (badge_x2, badge_y2)], radius=b_rad, fill=(2, 132, 199, 255), outline=(255, 255, 255, 230), width=max(1, int(s * 0.015)))

    font_size = int(badge_h * 0.68)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except Exception:
        font = ImageFont.load_default()

    text = 'EDU'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2
    ty = badge_y1 + (badge_h - th) / 2 - bbox[1]
    draw.text((tx, ty), text, fill=(255, 255, 255, 255), font=font)

    if is_round:
        mask = draw_circle_mask(s)
    else:
        mask = draw_squircle_mask(s, radius=int(s * 0.22))
    
    output = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    output.paste(img, (0, 0), mask)
    return output.resize((size, size), Image.Resampling.LANCZOS)


def create_staff_icon(size, is_round=False):
    scale = 4
    s = size * scale
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    top_color = (9, 13, 22)
    mid_color = (6, 78, 59)
    bottom_color = (180, 83, 9)
    
    for y in range(s):
        ratio = y / s
        if ratio < 0.6:
            t = ratio / 0.6
            r = int(top_color[0] * (1 - t) + mid_color[0] * t)
            g = int(top_color[1] * (1 - t) + mid_color[1] * t)
            b = int(top_color[2] * (1 - t) + mid_color[2] * t)
        else:
            t = (ratio - 0.6) / 0.4
            r = int(mid_color[0] * (1 - t) + bottom_color[0] * t)
            g = int(mid_color[1] * (1 - t) + bottom_color[1] * t)
            b = int(mid_color[2] * (1 - t) + bottom_color[2] * t)
        draw.line([(0, y), (s, y)], fill=(r, g, b, 255))

    margin = int(s * 0.04)
    draw.rounded_rectangle([(margin, margin), (s - margin, s - margin)], radius=int(s * 0.22), outline=(245, 158, 11, 140), width=int(s * 0.015))

    cx = s / 2
    pediment_top = s * 0.20
    pediment_bottom = s * 0.30
    ped_w = s * 0.54
    draw.polygon([
        (cx, pediment_top),
        (cx + ped_w / 2, pediment_bottom),
        (cx - ped_w / 2, pediment_bottom)
    ], fill=(251, 191, 36, 255))

    draw.rectangle([(cx - ped_w / 2, pediment_bottom), (cx + ped_w / 2, pediment_bottom + s * 0.03)], fill=(255, 255, 255, 255))

    col_top = pediment_bottom + s * 0.03
    col_bottom = s * 0.58
    col_w = s * 0.05
    col_spacing = (ped_w - s * 0.08) / 3
    col_start = cx - ped_w / 2 + s * 0.04

    for i in range(4):
        x = col_start + i * col_spacing
        col_color = (255, 255, 255, 255) if (i == 1 or i == 2) else (241, 245, 249, 230)
        draw.rectangle([(x - col_w / 2, col_top), (x + col_w / 2, col_bottom)], fill=col_color)

    draw.rectangle([(cx - ped_w / 2, col_bottom), (cx + ped_w / 2, col_bottom + s * 0.035)], fill=(251, 191, 36, 255))

    wreath_color = (251, 191, 36, 240)
    draw.arc([(cx - s * 0.38, s * 0.28), (cx - s * 0.18, s * 0.60)], start=90, end=270, fill=wreath_color, width=max(1, int(s * 0.02)))
    draw.arc([(cx + s * 0.18, s * 0.28), (cx + s * 0.38, s * 0.60)], start=270, end=90, fill=wreath_color, width=max(1, int(s * 0.02)))

    badge_w = s * 0.74
    badge_h = s * 0.20
    badge_x1 = int(cx - badge_w / 2)
    badge_y1 = int(s * 0.70)
    badge_x2 = int(cx + badge_w / 2)
    badge_y2 = int(badge_y1 + badge_h)

    b_rad = int(badge_h * 0.35)
    draw.rounded_rectangle([(badge_x1, badge_y1), (badge_x2, badge_y2)], radius=b_rad, fill=(16, 185, 129, 255), outline=(255, 255, 255, 230), width=max(1, int(s * 0.015)))

    font_size = int(badge_h * 0.65)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except Exception:
        font = ImageFont.load_default()

    text = 'STAFF'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2
    ty = badge_y1 + (badge_h - th) / 2 - bbox[1]
    draw.text((tx, ty), text, fill=(255, 255, 255, 255), font=font)

    if is_round:
        mask = draw_circle_mask(s)
    else:
        mask = draw_squircle_mask(s, radius=int(s * 0.22))
    
    output = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    output.paste(img, (0, 0), mask)
    return output.resize((size, size), Image.Resampling.LANCZOS)

print('Generating raster mipmap icons...')
edu_res_dir = f'{BASE_DIR}/android/AURXON_EDU/src/main/res'
staff_res_dir = f'{BASE_DIR}/android/AURXON_STAFF/src/main/res'

for folder, size in DENSITIES.items():
    d_dir = os.path.join(edu_res_dir, folder)
    os.makedirs(d_dir, exist_ok=True)
    create_edu_icon(size, is_round=False).save(os.path.join(d_dir, 'ic_launcher.png'), 'PNG')
    create_edu_icon(size, is_round=True).save(os.path.join(d_dir, 'ic_launcher_round.png'), 'PNG')
    print(f'  ✓ EDU {folder}: {size}x{size}')

    s_dir = os.path.join(staff_res_dir, folder)
    os.makedirs(s_dir, exist_ok=True)
    create_staff_icon(size, is_round=False).save(os.path.join(s_dir, 'ic_launcher.png'), 'PNG')
    create_staff_icon(size, is_round=True).save(os.path.join(s_dir, 'ic_launcher_round.png'), 'PNG')
    print(f'  ✓ STAFF {folder}: {size}x{size}')

os.makedirs(f'{BASE_DIR}/android/assets', exist_ok=True)
create_edu_icon(512, is_round=False).save(f'{BASE_DIR}/android/assets/aurxon_edu_512.png', 'PNG')
create_staff_icon(512, is_round=False).save(f'{BASE_DIR}/android/assets/aurxon_staff_512.png', 'PNG')

public_dir = f'{BASE_DIR}/public'
os.makedirs(public_dir, exist_ok=True)
create_edu_icon(32, is_round=False).save(f'{public_dir}/favicon.ico', 'ICO')
create_edu_icon(192, is_round=False).save(f'{public_dir}/icon-192.png', 'PNG')
create_edu_icon(512, is_round=False).save(f'{public_dir}/icon-512.png', 'PNG')
create_edu_icon(180, is_round=False).save(f'{public_dir}/apple-touch-icon.png', 'PNG')

print('All assets created cleanly!')
