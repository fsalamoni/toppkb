"""Regenera imagens didáticas com layout v6 — silhueta humana + anatomia destacada.

Layout v6 (Sprint 66):
- Header com cor do padrão KB
- Lado ESQUERDO: silhueta humana SVG + músculo destacado em cor
- Lado DIREITO: texto didático (título, descrição, cues, sensações)
- Seta conectando músculo ao texto
"""
import re
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# Importar silhueta e mapeamentos
sys.path.insert(0, os.path.dirname(__file__))
from silhueta_humana import get_silhueta, musculos_para_padrao

# === CONSTANTES ===
IMG_SIZE = 1080
HEADER_HEIGHT = 110
PADDING = 40

# Layout novo: split vertical 60/40
SPLIT_X = 480  # col 480 = início da área de texto
SILHUETA_WIDTH = 480  # largura silhueta
TEXTO_WIDTH = IMG_SIZE - SPLIT_X - PADDING  # 580 px

COLORS = {
    'bg': (15, 23, 42),
    'bg_card': (30, 41, 59),
    'bg_silhueta': (20, 30, 48),
    'header_text': (15, 23, 42),
    'text_primary': (226, 232, 240),
    'text_secondary': (148, 163, 184),
    'silhueta_stroke': (148, 163, 184),
    'silhueta_fill': (71, 85, 105),
    'muscle_default': (239, 68, 68),  # vermelho alaranjado
    'arrow': (250, 204, 21),  # amarelo
    'onde_bg': (30, 58, 138),
    'onde_border': (96, 165, 250),
    'onde_section_text': (147, 197, 253),
    'cues_bg': (15, 23, 42),
    'footer_text': (100, 116, 139),
    'label_bg': (15, 23, 42),
}

PADRAO_CORES = {
    'HINGE': (16, 185, 129),
    'SQUAT': (245, 158, 11),
    'PRESS': (139, 92, 246),
    'PULL': (6, 182, 212),
    'CARRY': (249, 115, 22),
    'ROT': (236, 72, 153),
    'COND': (239, 68, 68),
    'FLOW': (59, 130, 246),
}

# Mapeamento de cor hex para RGB
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def load_font(size, bold=False):
    paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                continue
    return ImageFont.load_default()

F_TITLE = load_font(36, bold=True)
F_HEADER_NAME = load_font(26, bold=True)
F_HEADER_SUB = load_font(14)
F_DESC = load_font(17)
F_SECTION = load_font(18, bold=True)
F_BODY = load_font(17)
F_FOOTER = load_font(13)
F_BIG_NUMBER = load_font(64, bold=True)
F_LABEL = load_font(15, bold=True)


def measure(text, font):
    draw = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    return draw.textlength(text, font=font)


def truncate_to_width(text, font, max_width):
    if not text:
        return ""
    if measure(text, font) <= max_width:
        return text
    while text and measure(text.rstrip() + "...", font) > max_width:
        text = text[:-1]
    return text.rstrip() + "..."


def wrap_text(text, font, max_width):
    if not text:
        return []
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = (current + " " + word).strip()
        if measure(test, font) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def extract_first_field(text, field):
    """Extrai primeiro campo de objeto (id, nome, padraoKb) de um bloco de exercício."""
    m = re.search(rf"\b{field}:\s*'([^']+)'", text)
    return m.group(1) if m else None


def parse_steps(text):
    """Extrai todos steps de um bloco de exercício."""
    steps = []
    step_pattern = r"\{\s*numero:\s*(\d+),\s*titulo:\s*'([^']+)',\s*descricao:\s*'([^']+)'"

    for step_match in re.finditer(step_pattern, text):
        numero = int(step_match.group(1))
        titulo = step_match.group(2)
        descricao = step_match.group(3)

        rest_start = step_match.end()
        rest = text[rest_start:rest_start+3000]
        next_step = rest.find('{ numero:')
        if next_step > -1:
            step_body = rest[:next_step]
        else:
            end_idx = rest.find('],')
            if end_idx > -1:
                step_body = rest[:end_idx+1]
            else:
                step_body = rest[:1000]

        cues_match = re.search(r"cues:\s*\[([^\]]+)\]", step_body)
        cues = []
        if cues_match:
            cues = re.findall(r"'((?:[^'\\]|\\.)*)'", cues_match.group(1))

        sens_match = re.search(r"sensacoes:\s*\[([^\]]*)\]", step_body, re.DOTALL)
        sensacoes = []
        if sens_match:
            sensacoes = re.findall(r"'((?:[^'\\]|\\.)*)'", sens_match.group(1))

        steps.append({
            'numero': numero,
            'titulo': titulo,
            'descricao': descricao,
            'cues': cues,
            'sensacoes': sensacoes,
        })

    return steps


def draw_silhueta(draw, padrao_kb, primary_muscle):
    """Desenha silhueta humana SVG no canto esquerdo com músculo destacado."""
    silhueta = get_silhueta("frontal")
    silhueta_w = silhueta["width"]
    silhueta_h = silhueta["height"]
    base_y = HEADER_HEIGHT + 20

    # Fundo da silhueta (escuro para contrastar com imagem)
    # ocupe toda a coluna esquerda
    draw.rectangle([0, HEADER_HEIGHT, SPLIT_X, IMG_SIZE - 30], fill=COLORS['bg_silhueta'])

    # Calcular escala para caber na área disponível
    avail_h = IMG_SIZE - HEADER_HEIGHT - 50
    avail_w = SPLIT_X
    scale = min(avail_w / silhueta_w, avail_h / silhueta_h) * 0.85
    draw_w = int(silhueta_w * scale)
    draw_h = int(silhueta_h * scale)

    # Centralizar horizontalmente
    offset_x = (SPLIT_X - draw_w) // 2
    offset_y = HEADER_HEIGHT + (avail_h - draw_h) // 2 + 10

    # Desenhar silhueta base (corpo todo em cinza)
    body_parts = [
        # Cabeça
        ("ellipse", offset_x + draw_w*0.40, offset_y + draw_h*0.04, draw_w*0.18, draw_h*0.06),
        # Pescoço
        ("rect", offset_x + draw_w*0.46, offset_y + draw_h*0.10, draw_w*0.08, draw_h*0.04),
        # Tronco (peito/barriga)
        ("rect", offset_x + draw_w*0.36, offset_y + draw_h*0.14, draw_w*0.28, draw_h*0.36),
        # Braço esquerdo
        ("rect", offset_x + draw_w*0.28, offset_y + draw_h*0.16, draw_w*0.08, draw_h*0.30),
        # Braço direito
        ("rect", offset_x + draw_w*0.64, offset_y + draw_h*0.16, draw_w*0.08, draw_h*0.30),
        # Antebraço esquerdo
        ("rect", offset_x + draw_w*0.28, offset_y + draw_h*0.46, draw_w*0.07, draw_h*0.18),
        # Antebraço direito
        ("rect", offset_x + draw_w*0.65, offset_y + draw_h*0.46, draw_w*0.07, draw_h*0.18),
        # Quadril
        ("rect", offset_x + draw_w*0.36, offset_y + draw_h*0.50, draw_w*0.28, draw_h*0.08),
        # Coxa esquerda
        ("rect", offset_x + draw_w*0.36, offset_y + draw_h*0.58, draw_w*0.13, draw_h*0.30),
        # Coxa direita
        ("rect", offset_x + draw_w*0.51, offset_y + draw_h*0.58, draw_w*0.13, draw_h*0.30),
        # Canela esquerda
        ("rect", offset_x + draw_w*0.36, offset_y + draw_h*0.88, draw_w*0.11, draw_h*0.22),
        # Canela direita
        ("rect", offset_x + draw_w*0.53, offset_y + draw_h*0.88, draw_w*0.11, draw_h*0.22),
    ]

    for shape in body_parts:
        kind = shape[0]
        if kind == "ellipse":
            cx, cy, w, h = shape[1], shape[2], shape[3], shape[4]
            draw.ellipse(
                [cx - w/2, cy - h/2, cx + w/2, cy + h/2],
                fill=COLORS['silhueta_fill'], outline=COLORS['silhueta_stroke'], width=2,
            )
        elif kind == "rect":
            x, y, w, h = shape[1], shape[2], shape[3], shape[4]
            draw.rounded_rectangle(
                [x, y, x + w, y + h], radius=8,
                fill=COLORS['silhueta_fill'], outline=COLORS['silhueta_stroke'], width=2,
            )

    # Destacar músculo primário em cor
    musculos = silhueta["musculos"]
    if primary_muscle and primary_muscle in musculos:
        m = musculos[primary_muscle]
        color = hex_to_rgb(m["color"])
        # Desenhar overlay do músculo (semi-opaco) cobrindo parte do corpo
        # Mapear coordenadas normalizadas para os rects da silhueta
        if primary_muscle == "gluteo_maximo":
            x, y, w, h = offset_x + draw_w*0.36, offset_y + draw_h*0.55, draw_w*0.28, draw_h*0.10
        elif primary_muscle == "isquiotibial":
            x, y, w, h = offset_x + draw_w*0.36, offset_y + draw_h*0.62, draw_w*0.13, draw_h*0.22
        elif primary_muscle == "quadriceps":
            x, y, w, h = offset_x + draw_w*0.51, offset_y + draw_h*0.62, draw_w*0.13, draw_h*0.22
        elif primary_muscle == "panturrilha":
            x, y, w, h = offset_x + draw_w*0.36, offset_y + draw_h*0.88, draw_w*0.11, draw_h*0.18
        elif primary_muscle == "deltoide":
            x, y, w, h = offset_x + draw_w*0.28, offset_y + draw_h*0.16, draw_w*0.08, draw_h*0.10
        elif primary_muscle == "peitoral":
            x, y, w, h = offset_x + draw_w*0.36, offset_y + draw_h*0.14, draw_w*0.28, draw_h*0.12
        elif primary_muscle == "biceps":
            x, y, w, h = offset_x + draw_w*0.28, offset_y + draw_h*0.22, draw_w*0.08, draw_h*0.22
        elif primary_muscle == "triceps":
            x, y, w, h = offset_x + draw_w*0.64, offset_y + draw_h*0.22, draw_w*0.08, draw_h*0.22
        elif primary_muscle == "antebraco":
            x, y, w, h = offset_x + draw_w*0.28, offset_y + draw_h*0.46, draw_w*0.07, draw_h*0.18
        elif primary_muscle == "core":
            x, y, w, h = offset_x + draw_w*0.40, offset_y + draw_h*0.28, draw_w*0.20, draw_h*0.22
        elif primary_muscle == "obliquo":
            x, y, w, h = offset_x + draw_w*0.36, offset_y + draw_h*0.40, draw_w*0.06, draw_h*0.10
        elif primary_muscle == "lombar":
            x, y, w, h = offset_x + draw_w*0.40, offset_y + draw_h*0.45, draw_w*0.20, draw_h*0.06
        else:
            x, y, w, h = 0, 0, 0, 0

        # Highlight em cor com transparência (simulada com cor mais clara)
        if w > 0:
            # Desenhar primeiro outline brilhante
            draw.rounded_rectangle(
                [x - 4, y - 4, x + w + 4, y + h + 4], radius=10,
                outline=color, width=3,
            )
            # Preencher com cor semi-transparente via tinta sólida mais clara
            lighter_color = tuple(min(255, c + 50) for c in color)
            draw.rounded_rectangle(
                [x, y, x + w, y + h], radius=8,
                fill=lighter_color,
            )

            # Label "MÚSCULO" + nome ao lado
            label_y_musculo = y + h + 15
            label_text = m.get("label", primary_muscle.upper())
            label_w = measure(label_text, F_LABEL)
            label_x = max(10, min(SPLIT_X - label_w - 10, x + w/2 - label_w/2))

            # Fundo do label
            draw.rounded_rectangle(
                [label_x - 5, label_y_musculo - 3, label_x + label_w + 5, label_y_musculo + 22],
                radius=5, fill=COLORS['label_bg'], outline=color, width=1,
            )
            draw.text((label_x, label_y_musculo), label_text, fill=color, font=F_LABEL)

    # Pequeno label "VISTA FRONTAL" no canto da silhueta
    draw.text((15, IMG_SIZE - 50), 'VISTA FRONTAL', fill=COLORS['text_secondary'], font=F_FOOTER)


def draw_arrow(draw, start_x, start_y, end_x, end_y, color):
    """Desenha uma seta diagonal do músculo para o texto."""
    import math
    # Linha
    draw.line([(start_x, start_y), (end_x, end_y)], fill=color, width=2)
    # Ponta da seta (pequeno triângulo)
    angle = math.atan2(end_y - start_y, end_x - start_x)
    arrow_len = 12
    p1x = end_x - arrow_len * math.cos(angle - math.pi / 6)
    p1y = end_y - arrow_len * math.sin(angle - math.pi / 6)
    p2x = end_x - arrow_len * math.cos(angle + math.pi / 6)
    p2y = end_y - arrow_len * math.sin(angle + math.pi / 6)
    draw.polygon([(end_x, end_y), (p1x, p1y), (p2x, p2y)], fill=color)


def generate_image(out_path, ex_nome, padrao_kb, step, primary_muscle="core"):
    """Gera imagem didática v6 — silhueta + texto."""
    img = Image.new('RGB', (IMG_SIZE, IMG_SIZE), COLORS['bg'])
    draw = ImageDraw.Draw(img)

    header_color = PADRAO_CORES.get(padrao_kb, (16, 185, 129))

    # === HEADER ===
    draw.rectangle([0, 0, IMG_SIZE, HEADER_HEIGHT], fill=header_color)
    # Silhueta side text (meio)
    draw.text((40, 32), ex_nome.upper(), fill=COLORS['header_text'], font=F_HEADER_NAME)

    import unicodedata
    slug = ex_nome.lower().replace(' ', '-').replace('(', '').replace(')', '').replace('/', '-')
    slug = ''.join(c for c in unicodedata.normalize('NFD', slug) if unicodedata.category(c) != 'Mn')
    draw.text((40, 68), f'kb-{slug}-step-{step["numero"]}', fill=COLORS['header_text'], font=F_HEADER_SUB)

    # Número do step (canto direito)
    cx, cy, r = IMG_SIZE - 60, 70, 40
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=COLORS['bg'])
    draw.text((cx, cy), str(step['numero']), fill=header_color, font=F_BIG_NUMBER, anchor='mm')

    # === SILHUETA (lado esquerdo) ===
    draw_silhueta(draw, padrao_kb, primary_muscle)

    # === ÁREA DE TEXTO (lado direito) ===
    # Linha divisória vertical sutil
    draw.line([(SPLIT_X, HEADER_HEIGHT), (SPLIT_X, IMG_SIZE - 30)], fill=(60, 70, 90), width=1)

    y = HEADER_HEIGHT + 30

    # === TÍTULO ===
    title_lines = wrap_text(step['titulo'], F_TITLE, TEXTO_WIDTH)
    for line in title_lines[:2]:
        draw.text((SPLIT_X + PADDING, y), line, fill=COLORS['text_primary'], font=F_TITLE)
        y += 44
    y += 15

    # === DESCRIÇÃO ===
    desc_lines = wrap_text(step['descricao'], F_DESC, TEXTO_WIDTH - 20)
    for line in desc_lines[:5]:
        draw.text((SPLIT_X + PADDING, y), line, fill=COLORS['text_secondary'], font=F_DESC)
        y += 26
    y += 18

    # === CUES TÉCNICOS ===
    cues_count = min(len(step['cues']), 4)
    if cues_count > 0:
        cues_h = 45 + cues_count * 36 + 10
        draw.rectangle(
            [SPLIT_X + PADDING, y, IMG_SIZE - PADDING, y + cues_h],
            outline=header_color, width=2, fill=COLORS['cues_bg'],
        )
        draw.text((SPLIT_X + PADDING + 12, y + 10), '▸ CUES TÉCNICOS', fill=header_color, font=F_SECTION)
        cy = y + 42
        for cue in step['cues'][:cues_count]:
            draw.text((SPLIT_X + PADDING + 20, cy), '●', fill=header_color, font=F_BODY)
            cue_text = f'"{truncate_to_width(cue, F_BODY, TEXTO_WIDTH - 100)}"'
            draw.text((SPLIT_X + PADDING + 45, cy), cue_text, fill=COLORS['text_primary'], font=F_BODY)
            cy += 34
        y += cues_h + 18

    # === ONDE SENTIR ===
    max_sens = min(len(step['sensacoes']), 4)
    if max_sens > 0:
        sens_h = 45 + max_sens * 34 + 10
        # Não desenhar se ultrapassar o footer
        if y + sens_h < IMG_SIZE - 60:
            draw.rectangle(
                [SPLIT_X + PADDING, y, IMG_SIZE - PADDING, y + sens_h],
                outline=COLORS['onde_border'], width=2, fill=COLORS['onde_bg'],
            )
            draw.text((SPLIT_X + PADDING + 12, y + 10), '▸ ONDE SENTIR', fill=COLORS['onde_section_text'], font=F_SECTION)
            oy = y + 42
            for s in step['sensacoes'][:max_sens]:
                draw.text((SPLIT_X + PADDING + 20, oy), '•', fill=COLORS['onde_section_text'], font=F_BODY)
                s_text = truncate_to_width(s, F_BODY, TEXTO_WIDTH - 80)
                draw.text((SPLIT_X + PADDING + 42, oy), s_text, fill=COLORS['text_primary'], font=F_BODY)
                oy += 32

    # === FOOTER ===
    draw.text(
        (SPLIT_X + PADDING, IMG_SIZE - 22),
        'TOP PICKLEBALL 50+ · clique no app para mais',
        fill=COLORS['footer_text'], font=F_FOOTER,
    )

    img.save(out_path, optimize=True)
    return out_path


if __name__ == '__main__':
    seed_path = 'frontend/src/data/seed/exercicios-kettlebell.ts'
    out_dir = 'frontend/public/kettlebell/step-images'

    print(f'Lendo seed...')
    with open(seed_path, 'r') as f:
        content = f.read()

    chunks = re.split(r"(?=    id: 'kb-)", content)

    total_ex = 0
    total_steps = 0
    errors = []

    for chunk in chunks:
        if 'id: \'kb-' not in chunk:
            continue

        ex_id = extract_first_field(chunk, 'id')
        nome = extract_first_field(chunk, 'nome')
        padrao = extract_first_field(chunk, 'padraoKb')

        if not (ex_id and nome and padrao):
            continue

        # Mapear músculos destacados pelo padrão
        musculos_dest = musculos_para_padrao(padrao)

        steps = parse_steps(chunk)
        if not steps:
            continue

        total_ex += 1
        for s_idx, step in enumerate(steps):
            # Rotaciona entre os músculos disponíveis a cada step
            primary = musculos_dest[s_idx % len(musculos_dest)]
            out_path = f'{out_dir}/{ex_id}-step-{step["numero"]}.png'
            try:
                generate_image(out_path, nome, padrao, step, primary_muscle=primary)
                total_steps += 1
            except Exception as e:
                errors.append(f'{ex_id}-step-{step["numero"]}: {e}')

    print(f'\n✅ Exercícios: {total_ex}')
    print(f'✅ Steps geradas: {total_steps}')
    if errors:
        print(f'\n❌ Erros: {len(errors)}')
        for e in errors[:5]:
            print(f'  {e}')
