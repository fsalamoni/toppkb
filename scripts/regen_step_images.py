"""Regenera imagens didáticas com layout v5 — sem texto cortado."""
import re
import os
from PIL import Image, ImageDraw, ImageFont

# === CONSTANTES ===
IMG_SIZE = 1080
HEADER_HEIGHT = 110
PADDING = 50

COLORS = {
    'bg': (15, 23, 42),
    'bg_card': (30, 41, 59),
    'header_text': (15, 23, 42),
    'text_primary': (226, 232, 240),
    'text_secondary': (148, 163, 184),
    'onde_bg': (30, 58, 138),
    'onde_border': (96, 165, 250),
    'onde_section_text': (147, 197, 253),
    'cues_bg': (15, 23, 42),
    'footer_text': (100, 116, 139),
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

F_TITLE = load_font(54, bold=True)
F_HEADER_NAME = load_font(26, bold=True)
F_HEADER_SUB = load_font(14)
F_DESC = load_font(20)
F_SECTION = load_font(22, bold=True)
F_BODY = load_font(20)
F_FOOTER = load_font(14)
F_BIG_NUMBER = load_font(64, bold=True)

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
    # Cada step começa com { numero:
    step_pattern = r"\{\s*numero:\s*(\d+),\s*titulo:\s*'([^']+)',\s*descricao:\s*'([^']+)'"
    
    for step_match in re.finditer(step_pattern, text):
        numero = int(step_match.group(1))
        titulo = step_match.group(2)
        descricao = step_match.group(3)
        
        # Pegar o resto do step (até a próxima { numero: ou )
        rest_start = step_match.end()
        rest = text[rest_start:rest_start+3000]
        # Encontrar fecha-chaves do step
        # Vou pegar até encontrar outro { numero: ou fim do array
        next_step = rest.find('{ numero:')
        if next_step > -1:
            step_body = rest[:next_step]
        else:
            # até ]
            end_idx = rest.find('],')
            if end_idx > -1:
                step_body = rest[:end_idx+1]
            else:
                step_body = rest[:1000]
        
        # Extrair cues
        cues_match = re.search(r"cues:\s*\[([^\]]+)\]", step_body)
        cues = []
        if cues_match:
            cues = re.findall(r"'((?:[^'\\]|\\.)*)'", cues_match.group(1))
        
        # Extrair sensações
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

def generate_image(out_path, ex_nome, padrao_kb, step):
    """Gera imagem didática v5."""
    img = Image.new('RGB', (IMG_SIZE, IMG_SIZE), COLORS['bg'])
    draw = ImageDraw.Draw(img)
    
    header_color = PADRAO_CORES.get(padrao_kb, (16, 185, 129))
    
    # === HEADER ===
    draw.rectangle([0, 0, IMG_SIZE, HEADER_HEIGHT], fill=header_color)
    draw.text((40, 32), ex_nome.upper(), fill=COLORS['header_text'], font=F_HEADER_NAME)
    
    # Subtitle (id)
    slug = ex_nome.lower().replace(' ', '-').replace('(', '').replace(')', '').replace('/', '-')
    # Remover acentos
    import unicodedata
    slug = ''.join(c for c in unicodedata.normalize('NFD', slug) if unicodedata.category(c) != 'Mn')
    draw.text((40, 68), f'kb-{slug}-step-{step["numero"]}', fill=COLORS['header_text'], font=F_HEADER_SUB)
    
    # Número do step (canto direito) — círculo preto
    cx, cy, r = IMG_SIZE-90, 70, 50
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=COLORS['bg'])
    draw.text((cx, cy), str(step['numero']), fill=header_color, font=F_BIG_NUMBER, anchor='mm')
    
    y = HEADER_HEIGHT + 30
    
    # === TÍTULO ===
    draw.text((PADDING, y), step['titulo'], fill=COLORS['text_primary'], font=F_TITLE)
    y += 75
    
    # === DESCRIÇÃO ===
    desc_lines = wrap_text(step['descricao'], F_DESC, IMG_SIZE - 2*PADDING)
    for line in desc_lines[:4]:
        draw.text((PADDING, y), line, fill=COLORS['text_secondary'], font=F_DESC)
        y += 30
    y += 25
    
    # === CUES TÉCNICOS ===
    cues_h = 55 + len(step['cues']) * 38 + 15
    draw.rectangle([PADDING, y, IMG_SIZE-PADDING, y + cues_h],
                   outline=header_color, width=3, fill=COLORS['cues_bg'])
    draw.text((PADDING+20, y+15), '▸ CUES TÉCNICOS (o que fazer)', fill=header_color, font=F_SECTION)
    cy = y + 60
    for cue in step['cues']:
        draw.text((PADDING+30, cy), '●', fill=header_color, font=F_BODY)
        cue_text = f'"{truncate_to_width(cue, F_BODY, IMG_SIZE - 2*PADDING - 90)}"'
        draw.text((PADDING+60, cy), cue_text, fill=COLORS['text_primary'], font=F_BODY)
        cy += 38
    y += cues_h + 25
    
    # === ONDE SENTIR (full-width) ===
    max_sens = min(len(step['sensacoes']), 6)
    if max_sens > 0:
        onde_h = 55 + max_sens * 38 + 15
        draw.rectangle([PADDING, y, IMG_SIZE-PADDING, y + onde_h],
                       outline=COLORS['onde_border'], width=3, fill=COLORS['onde_bg'])
        draw.text((PADDING+20, y+15), '▸ ONDE SENTIR (músculo)', fill=COLORS['onde_section_text'], font=F_SECTION)
        oy = y + 60
        for s in step['sensacoes'][:max_sens]:
            draw.text((PADDING+30, oy), '•', fill=COLORS['onde_section_text'], font=F_BODY)
            s_text = truncate_to_width(s, F_BODY, IMG_SIZE - 2*PADDING - 80)
            draw.text((PADDING+55, oy), s_text, fill=COLORS['text_primary'], font=F_BODY)
            oy += 38
        y += onde_h + 20
    
    # === FOOTER ===
    draw.text((PADDING, IMG_SIZE - 30), 
              'TOP PICKLEBALL 50+ · clique no app para detalhes completos · passo a passo',
              fill=COLORS['footer_text'], font=F_FOOTER)
    
    img.save(out_path, optimize=True)
    return out_path

if __name__ == '__main__':
    seed_path = 'frontend/src/data/seed/exercicios-kettlebell.ts'
    out_dir = 'frontend/public/kettlebell/step-images'
    
    print(f'Lendo seed...')
    with open(seed_path, 'r') as f:
        content = f.read()
    
    # Split por "id: 'kb-" para pegar cada bloco
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
        
        steps = parse_steps(chunk)
        if not steps:
            continue
        
        total_ex += 1
        for step in steps:
            out_path = f'{out_dir}/{ex_id}-step-{step["numero"]}.png'
            try:
                generate_image(out_path, nome, padrao, step)
                total_steps += 1
            except Exception as e:
                errors.append(f'{ex_id}-step-{step["numero"]}: {e}')
    
    print(f'\n✅ Exercícios: {total_ex}')
    print(f'✅ Steps geradas: {total_steps}')
    if errors:
        print(f'\n❌ Erros: {len(errors)}')
        for e in errors[:5]:
            print(f'  {e}')
