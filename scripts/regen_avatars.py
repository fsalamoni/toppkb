"""
Gera avatares SVG com anatomia detalhada (Sprint 67).

Para cada step de cada exercício, escolhe um template baseado no padrão KB + step,
e renderiza com:
- Stick figure estilizado
- Articulações (círculos coloridos: ombro, cotovelo, quadril, joelho, tornozelo, punho)
- KB rico (bola + alça + handle)
- Linhas tracejadas (plano de referência)
- Labels de ângulo (90°, 180°)
- Label "FRONTAL" ou "LATERAL"
- Label "PASSO N" no canto

Layout:
- ViewBox: 400 x 600
- Header (60px alto)
- Avatar (500px alto) com stick figure + KB
- Footer (40px alto) com legenda
"""

import re
import os
import sys
from pathlib import Path

# Cores
COLORS = {
    'bg': '#0f172a',
    'text_primary': '#cbd5e1',
    'text_secondary': '#94a3b8',
    'stick': '#cbd5e1',
    'stick_thin': '#64748b',
    'joint_default': '#fbbf24',  # amarelo
    'joint_emphasis': '#ef4444',  # vermelho - articulação em foco
    'joint_passive': '#64748b',  # cinza - passiva
    'kb_ball': '#a8a29e',  # cinza claro
    'kb_handle': '#57534e',  # cinza escuro
    'kb_outline': '#1c1917',  # preto
    'kb_highlight': '#fbbf24',  # amarelo
    'plane_ref': '#475569',  # plano de referência
    'angle_arc': '#10b981',  # verde para ângulos
    'angle_label': '#34d399',
    'label_bg': '#1e293b',
    'label_text': '#e2e8f0',
    'border': '#334155',
}

PADRAO_CORES = {
    'HINGE': '#10b981',
    'SQUAT': '#f59e0b',
    'PRESS': '#a855f7',
    'PULL': '#06b6d4',
    'CARRY': '#f97316',
    'ROT': '#ec4899',
    'COND': '#ef4444',
    'FLOW': '#3b82f6',
}

# Articulações padrão (para qualquer stick figure)
# Posições: (cx, cy, label, is_emphasis)
def joint(x, y, r=5, color=None, label=None):
    """Cria articulação (círculo)."""
    color = color or COLORS['joint_default']
    circle = f'<circle cx="{x}" cy="{y}" r="{r}" fill="{COLORS["bg"]}" stroke="{color}" stroke-width="2.5"/>'
    inner = f'<circle cx="{x}" cy="{y}" r="{r-2.5}" fill="{color}" opacity="0.7"/>'
    if label:
        return circle + inner + f'<text x="{x}" y="{y+1}" font-size="8" fill="{COLORS["bg"]}" text-anchor="middle" font-weight="bold" font-family="sans-serif">{label}</text>'
    return circle + inner


def stick_line(x1, y1, x2, y2, color=None, width=8, dash=None):
    """Linha grossa do stick figure."""
    color = color or COLORS['stick']
    if dash:
        return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}" stroke-dasharray="4,3" stroke-linecap="round"/>'
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>'


def kbell(cx, cy, scale=1.0, highlight=False):
    """Kettlebell detalhado: bola + alça + handle."""
    s = scale
    parts = []
    # Bola (corpo principal)
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{18*s}" fill="{COLORS["kb_ball"]}" stroke="{COLORS["kb_outline"]}" stroke-width="1.5"/>')
    # Alça (de cada lado da bola)
    parts.append(f'<path d="M {cx-12*s} {cy-15*s} Q {cx} {cy-30*s} {cx+12*s} {cy-15*s}" fill="none" stroke="{COLORS["kb_handle"]}" stroke-width="{2.5*s}"/>')
    # Handle interno
    parts.append(f'<rect x="{cx-9*s}" y="{cy-25*s}" width="{18*s}" height="{12*s}" rx="{4*s}" fill="none" stroke="{COLORS["kb_handle"]}" stroke-width="{1.5*s}"/>')
    # Pequeno destaque (light reflection)
    if highlight:
        parts.append(f'<circle cx="{cx-6*s}" cy="{cy-6*s}" r="{3*s}" fill="{COLORS["kb_highlight"]}" opacity="0.6"/>')
    return ''.join(parts)


def angle_arc(cx, cy, r, start_angle, end_angle, color=None):
    """Desenha um arco indicando um ângulo."""
    import math
    color = color or COLORS['angle_arc']
    # SVG arc path
    x1 = cx + r * math.cos(start_angle * math.pi / 180)
    y1 = cy + r * math.sin(start_angle * math.pi / 180)
    x2 = cx + r * math.cos(end_angle * math.pi / 180)
    y2 = cy + r * math.sin(end_angle * math.pi / 180)
    # Determinar sweep_flag (1 se end_angle > start_angle)
    sweep = 1 if end_angle > start_angle else 0
    return f'<path d="M {x1:.1f} {y1:.1f} A {r} {r} 0 0 {sweep} {x2:.1f} {y2:.1f}" fill="none" stroke="{color}" stroke-width="2"/>'


def label(x, y, text, color=None, size=11):
    """Label pequeno com fundo."""
    color = color or COLORS['label_text']
    w = len(text) * size * 0.55 + 10
    bg = f'<rect x="{x-w/2}" y="{y-size+2}" width="{w}" height="{size+4}" rx="4" fill="{COLORS["label_bg"]}" opacity="0.95"/>'
    txt = f'<text x="{x}" y="{y+3}" font-size="{size}" fill="{color}" text-anchor="middle" font-family="sans-serif" font-weight="500">{text}</text>'
    return bg + txt


def angle_label(cx, cy, text, color=None):
    """Label de ângulo (ex: '90°')."""
    return label(cx, cy, text, color=color or COLORS['angle_label'], size=13)


def plane_ref_vertical(x, y_top, y_bottom, dash=True):
    """Linha tracejada vertical (plano de referência)."""
    dash_attr = 'stroke-dasharray="6,4"' if dash else ''
    return f'<line x1="{x}" y1="{y_top}" x2="{x}" y2="{y_bottom}" stroke="{COLORS["plane_ref"]}" stroke-width="1" {dash_attr} opacity="0.6"/>'


def plane_ref_horizontal(y, x_start, x_end, dash=True):
    """Linha tracejada horizontal."""
    dash_attr = 'stroke-dasharray="6,4"' if dash else ''
    return f'<line x1="{x_start}" y1="{y}" x2="{x_end}" y2="{y}" stroke="{COLORS["plane_ref"]}" stroke-width="1" {dash_attr} opacity="0.6"/>'


# ====================================================================
# TEMPLATES — um por posição
# ====================================================================

def template_stand_upright(padrao_color, step_num, has_kb='rack'):
    """Em pé, posição neutra (pré-ação)."""
    cx = 200  # centro
    head_y = 170
    pelvis_y = 380
    parts = []

    # Plano de referência (linha vertical do meio)
    parts.append(plane_ref_vertical(200, 130, 530))

    # Cabeça
    parts.append(joint(cx, head_y, r=12))
    parts.append(f'<circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')

    # Pescoço + tronco
    parts.append(stick_line(cx, head_y+22, cx, pelvis_y-15, width=14))

    # Pelve
    parts.append(joint(cx, pelvis_y, r=8, color=COLORS['joint_emphasis']))

    # Braços
    if has_kb == 'rack':
        # KB no rack: cotovelos próximos ao corpo
        parts.append(stick_line(cx-2, head_y+30, cx-25, head_y+60, width=7))  # ombro-cotovelo
        parts.append(stick_line(cx+2, head_y+30, cx+25, head_y+60, width=7))
        parts.append(stick_line(cx-25, head_y+60, cx-25, head_y+90, width=7))  # cotovelo-punho
        parts.append(stick_line(cx+25, head_y+60, cx+25, head_y+90, width=7))
        # KB no rack (peito)
        parts.append(kbell(cx, head_y+95, scale=0.85))
        # Articulações
        parts.append(joint(cx-25, head_y+90, r=5, label=None))
        parts.append(joint(cx+25, head_y+90, r=5, label=None))
    else:
        # Braços para baixo (sem KB)
        parts.append(stick_line(cx-2, head_y+30, cx-25, head_y+90, width=7))
        parts.append(stick_line(cx+2, head_y+30, cx+25, head_y+90, width=7))
        parts.append(stick_line(cx-25, head_y+90, cx-25, head_y+150, width=7))
        parts.append(stick_line(cx+25, head_y+90, cx+25, head_y+150, width=7))
        parts.append(joint(cx-25, head_y+150, r=5))
        parts.append(joint(cx+25, head_y+150, r=5))
        parts.append(joint(cx-25, head_y+90, r=5))
        parts.append(joint(cx+25, head_y+90, r=5))

    # Coxas (em pé)
    parts.append(stick_line(cx-30, pelvis_y, cx-35, pelvis_y+70, width=10))
    parts.append(stick_line(cx+30, pelvis_y, cx+35, pelvis_y+70, width=10))
    # Joelhos
    parts.append(joint(cx-35, pelvis_y+70, r=6, color=COLORS['joint_emphasis']))
    parts.append(joint(cx+35, pelvis_y+70, r=6, color=COLORS['joint_emphasis']))
    # Canelas
    parts.append(stick_line(cx-35, pelvis_y+70, cx-35, pelvis_y+135, width=9))
    parts.append(stick_line(cx+35, pelvis_y+70, cx+35, pelvis_y+135, width=9))
    # Tornozelos
    parts.append(joint(cx-35, pelvis_y+135, r=5))
    parts.append(joint(cx+35, pelvis_y+135, r=5))
    # Chão
    parts.append(stick_line(cx-50, pelvis_y+145, cx+50, pelvis_y+145, width=3))
    # Label
    parts.append(label(cx+80, head_y, "EM PÉ", color=padata_color if False else padrao_color, size=11))

    return ''.join(parts)


def template_hinge_position(padrao_color, step_num, kb_pos='between_legs'):
    """Hinge: quadril para trás, costas retas (preparação swing/deadlift)."""
    cx = 200
    head_y = 200
    pelvis_y = 400
    parts = []

    # Plano de referência (vertical)
    parts.append(plane_ref_vertical(200, 150, 530))
    # Plano de costas retas (tracejado diagonal para mostrar inclinação)
    parts.append(f'<line x1="200" y1="180" x2="190" y2="400" stroke="{COLORS["plane_ref"]}" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>')

    # Cabeça inclinada (seguindo costas)
    parts.append(f'<circle cx="{cx-10}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')

    # Tronco inclinado
    parts.append(stick_line(cx-10, head_y+22, cx-5, pelvis_y-10, width=14))

    # Pelve (destacada)
    parts.append(joint(cx+8, pelvis_y, r=8, color=COLORS['joint_emphasis']))

    # Braços esticados para baixo (segurando KB entre pernas)
    if kb_pos == 'between_legs':
        # Braços formando 90° com o torso
        parts.append(stick_line(cx-3, head_y+40, cx-15, pelvis_y-15, width=7))  # ombro
        parts.append(stick_line(cx+5, head_y+40, cx+15, pelvis_y-15, width=7))
        # KB entre as pernas (atrás)
        parts.append(stick_line(cx-15, pelvis_y-15, cx-15, pelvis_y+30, width=7))
        parts.append(stick_line(cx+15, pelvis_y-15, cx+15, pelvis_y+30, width=7))
        # KB
        parts.append(kbell(cx, pelvis_y+50, scale=0.85))
        # Articulações
        parts.append(joint(cx-15, pelvis_y+30, r=5))
        parts.append(joint(cx+15, pelvis_y+30, r=5))

    # Coxas (dobradas)
    parts.append(stick_line(cx+8, pelvis_y, cx+30, pelvis_y+30, width=10))
    parts.append(joint(cx+30, pelvis_y+30, r=6, color=COLORS['joint_emphasis']))
    # Canela (vertical)
    parts.append(stick_line(cx+30, pelvis_y+30, cx+30, pelvis_y+130, width=9))
    parts.append(joint(cx+30, pelvis_y+130, r=5))
    # Coxa esquerda (invisível por trás, mas simétrica)
    parts.append(stick_line(cx+8, pelvis_y, cx-30, pelvis_y+30, width=10))
    parts.append(joint(cx-30, pelvis_y+30, r=6))
    parts.append(stick_line(cx-30, pelvis_y+30, cx-30, pelvis_y+130, width=9))
    parts.append(joint(cx-30, pelvis_y+130, r=5))

    # Ângulo 90° entre tronco e coxa (label)
    parts.append(angle_arc(cx+8, pelvis_y, 25, -90, 0))
    parts.append(angle_label(cx+8, pelvis_y-12, "90°"))

    # Chão
    parts.append(stick_line(cx-50, pelvis_y+135, cx+50, pelvis_y+135, width=3))
    # Label
    parts.append(label(cx, head_y-30, "HINGE — quadril para trás", color=padrao_color))

    return ''.join(parts)


def template_squat_top(padrao_color, step_num):
    """Squat top: em pé, antes de agachar (posição inicial goblet/front squat)."""
    cx = 200
    head_y = 170
    pelvis_y = 380
    parts = []

    parts.append(plane_ref_vertical(200, 130, 530))

    # Cabeça
    parts.append(f'<circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')

    # Tronco
    parts.append(stick_line(cx, head_y+22, cx, pelvis_y-15, width=14))

    # Pelve
    parts.append(joint(cx, pelvis_y, r=8))

    # Braços com KB no peito (goblet)
    parts.append(stick_line(cx-2, head_y+30, cx-25, head_y+60, width=7))
    parts.append(stick_line(cx+2, head_y+30, cx+25, head_y+60, width=7))
    parts.append(stick_line(cx-25, head_y+60, cx-25, head_y+95, width=7))
    parts.append(stick_line(cx+25, head_y+60, cx+25, head_y+95, width=7))
    parts.append(joint(cx-25, head_y+95, r=5))
    parts.append(joint(cx+25, head_y+95, r=5))
    parts.append(kbell(cx, head_y+105, scale=0.9))

    # Coxas
    parts.append(stick_line(cx-25, pelvis_y, cx-30, pelvis_y+70, width=10))
    parts.append(stick_line(cx+25, pelvis_y, cx+30, pelvis_y+70, width=10))
    parts.append(joint(cx-30, pelvis_y+70, r=6))
    parts.append(joint(cx+30, pelvis_y+70, r=6))
    # Canelas
    parts.append(stick_line(cx-30, pelvis_y+70, cx-30, pelvis_y+135, width=9))
    parts.append(stick_line(cx+30, pelvis_y+70, cx+30, pelvis_y+135, width=9))
    parts.append(joint(cx-30, pelvis_y+135, r=5))
    parts.append(joint(cx+30, pelvis_y+135, r=5))

    parts.append(stick_line(cx-50, pelvis_y+145, cx+50, pelvis_y+145, width=3))
    parts.append(label(cx+85, head_y, "AGACHAMENTO", color=padrao_color))

    return ''.join(parts)


def template_squat_bottom(padrao_color, step_num):
    """Squat bottom: agachado completo."""
    cx = 200
    head_y = 270  # cabeça mais baixa
    pelvis_y = 410  # quadril abaixado
    parts = []

    parts.append(plane_ref_vertical(200, 230, 530))

    # Seta indicando descida
    parts.append(f'<text x="80" y="200" font-size="40" fill="{padrao_color}" opacity="0.4" font-weight="bold">↓</text>')

    # Cabeça
    parts.append(f'<circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')

    # Tronco levemente inclinado
    parts.append(stick_line(cx, head_y+22, cx+8, pelvis_y-10, width=14))

    # Pelve (destacada)
    parts.append(joint(cx+8, pelvis_y, r=8, color=COLORS['joint_emphasis']))

    # Braços + KB
    parts.append(stick_line(cx+2, head_y+30, cx+25, head_y+50, width=7))
    parts.append(stick_line(cx+8, head_y+30, cx+30, head_y+50, width=7))
    parts.append(stick_line(cx+25, head_y+50, cx+25, head_y+80, width=7))
    parts.append(stick_line(cx+30, head_y+50, cx+30, head_y+80, width=7))
    parts.append(joint(cx+25, head_y+80, r=5))
    parts.append(joint(cx+30, head_y+80, r=5))
    parts.append(kbell(cx+8, head_y+95, scale=0.85))

    # Coxas paralelas ao chão (forçadas)
    parts.append(stick_line(cx+8, pelvis_y, cx+50, pelvis_y-15, width=10))
    parts.append(joint(cx+50, pelvis_y-15, r=6, color=COLORS['joint_emphasis']))
    # Canela vertical
    parts.append(stick_line(cx+50, pelvis_y-15, cx+50, pelvis_y+90, width=9))
    parts.append(joint(cx+50, pelvis_y+90, r=5))
    # Pernas esquerda (simétrica)
    parts.append(stick_line(cx+8, pelvis_y, cx-50, pelvis_y-15, width=10))
    parts.append(joint(cx-50, pelvis_y-15, r=6, color=COLORS['joint_emphasis']))
    parts.append(stick_line(cx-50, pelvis_y-15, cx-50, pelvis_y+90, width=9))
    parts.append(joint(cx-50, pelvis_y+90, r=5))

    # Ângulo de joelho (90°)
    parts.append(angle_arc(cx+50, pelvis_y-15, 22, 0, 90))
    parts.append(angle_label(cx+50, pelvis_y-30, "90°"))

    parts.append(stick_line(cx-50, pelvis_y+95, cx+50, pelvis_y+95, width=3))
    parts.append(label(cx+85, head_y, "FUNDO", color=padrao_color))

    return ''.join(parts)


def template_overhead_lockout(padrao_color, step_num, kb_count=1):
    """Lockout: KB no topo, braço(s) totalmente estendido(s)."""
    cx = 200
    head_y = 230
    pelvis_y = 420
    parts = []

    parts.append(plane_ref_vertical(200, 130, 530))

    # Cabeça
    parts.append(f'<circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')

    # Tronco
    parts.append(stick_line(cx, head_y+22, cx, pelvis_y-10, width=14))
    parts.append(joint(cx, pelvis_y, r=8))

    if kb_count == 1:
        # Single arm
        # Braço direito estendido verticalmente acima da cabeça
        parts.append(stick_line(cx+2, head_y+30, cx+25, head_y+30, width=8))
        parts.append(stick_line(cx+25, head_y+30, cx+25, head_y-15, width=8))
        parts.append(joint(cx+25, head_y+30, r=5))
        # KB no topo
        parts.append(kbell(cx+25, head_y-50, scale=0.95, highlight=True))
        # Braço esquerdo colado
        parts.append(stick_line(cx-2, head_y+30, cx-20, head_y+90, width=7))
        parts.append(stick_line(cx-20, head_y+90, cx-20, head_y+150, width=7))
        parts.append(joint(cx-20, head_y+90, r=5))
        parts.append(joint(cx-20, head_y+150, r=5))
    else:
        # Two arms
        parts.append(stick_line(cx-3, head_y+30, cx-25, head_y+30, width=8))
        parts.append(stick_line(cx+3, head_y+30, cx+25, head_y+30, width=8))
        parts.append(stick_line(cx-25, head_y+30, cx-25, head_y-30, width=8))
        parts.append(stick_line(cx+25, head_y+30, cx+25, head_y-30, width=8))
        parts.append(joint(cx-25, head_y+30, r=5))
        parts.append(joint(cx+25, head_y+30, r=5))
        parts.append(kbell(cx-25, head_y-65, scale=0.9, highlight=True))
        parts.append(kbell(cx+25, head_y-65, scale=0.9, highlight=True))

    # Pernas em pé
    parts.append(stick_line(cx-25, pelvis_y, cx-30, pelvis_y+70, width=10))
    parts.append(stick_line(cx+25, pelvis_y, cx+30, pelvis_y+70, width=10))
    parts.append(joint(cx-30, pelvis_y+70, r=6))
    parts.append(joint(cx+30, pelvis_y+70, r=6))
    parts.append(stick_line(cx-30, pelvis_y+70, cx-30, pelvis_y+135, width=9))
    parts.append(stick_line(cx+30, pelvis_y+70, cx+30, pelvis_y+135, width=9))
    parts.append(joint(cx-30, pelvis_y+135, r=5))
    parts.append(joint(cx+30, pelvis_y+135, r=5))

    parts.append(stick_line(cx-50, pelvis_y+145, cx+50, pelvis_y+145, width=3))
    parts.append(label(cx, head_y-90, "LOCKOUT — 180°", color=padrao_color))
    # Linha reta (180°) no braço
    parts.append(f'<line x1="{cx+25}" y1="{head_y+50}" x2="{cx+25}" y2="{head_y-20}" stroke="{padrao_color}" stroke-width="1.5" stroke-dasharray="4,3"/>')
    return ''.join(parts)


def template_carry_upright(padrao_color, step_num, side='left'):
    """CARRY: em pé com KB carregado (farmer/waiter/rack carry)."""
    cx = 200
    head_y = 170
    pelvis_y = 380
    parts = []

    parts.append(plane_ref_vertical(200, 130, 530))

    parts.append(f'<circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')
    parts.append(stick_line(cx, head_y+22, cx, pelvis_y-10, width=14))
    parts.append(joint(cx, pelvis_y, r=8))

    if side == 'left':
        x_arm = cx-30
    else:
        x_arm = cx+30

    # Braço com KB (pendurado)
    parts.append(stick_line(cx-2, head_y+30, x_arm, head_y+80, width=8))
    parts.append(stick_line(cx+2, head_y+30, x_arm-5, head_y+80, width=8))
    parts.append(stick_line(x_arm, head_y+80, x_arm, head_y+150, width=8))
    parts.append(stick_line(x_arm-5, head_y+80, x_arm-5, head_y+150, width=8))
    parts.append(joint(x_arm, head_y+80, r=5))
    parts.append(joint(x_arm-5, head_y+80, r=5))
    parts.append(joint(x_arm, head_y+150, r=5))
    parts.append(joint(x_arm-5, head_y+150, r=5))
    parts.append(kbell((x_arm+x_arm-5)/2, head_y+180, scale=1.0))

    # Outro braço relaxado
    if side == 'left':
        x_other = cx+20
    else:
        x_other = cx-20
    parts.append(stick_line(cx+2 if side=='left' else -2, head_y+30, x_other, head_y+90, width=7))
    parts.append(stick_line(x_other, head_y+90, x_other, head_y+150, width=7))
    parts.append(joint(x_other, head_y+90, r=5))
    parts.append(joint(x_other, head_y+150, r=5))

    # Pernas
    parts.append(stick_line(cx-25, pelvis_y, cx-30, pelvis_y+70, width=10))
    parts.append(stick_line(cx+25, pelvis_y, cx+30, pelvis_y+70, width=10))
    parts.append(joint(cx-30, pelvis_y+70, r=6))
    parts.append(joint(cx+30, pelvis_y+70, r=6))
    parts.append(stick_line(cx-30, pelvis_y+70, cx-30, pelvis_y+135, width=9))
    parts.append(stick_line(cx+30, pelvis_y+70, cx+30, pelvis_y+135, width=9))
    parts.append(joint(cx-30, pelvis_y+135, r=5))
    parts.append(joint(cx+30, pelvis_y+135, r=5))

    parts.append(stick_line(cx-50, pelvis_y+145, cx+50, pelvis_y+145, width=3))
    # Seta indicando movimento
    parts.append(f'<text x="340" y="350" font-size="40" fill="{padrao_color}" opacity="0.5" font-weight="bold">→</text>')
    parts.append(label(cx+85, head_y, "CARRY", color=padrao_color))
    return ''.join(parts)


def template_lying_setup(padrao_color, step_num):
    """Deitado/supino: para TGU, press deitado, etc."""
    cx = 200
    parts = []

    # Plano de referência horizontal (chão)
    parts.append(plane_ref_horizontal(380, 30, 380))
    parts.append(plane_ref_vertical(cx, 140, 480))

    # Stick figure horizontal: cabeça na direita, pés na esquerda
    head_x = 90
    head_y = 380
    feet_x = 310

    # Cabeça (esquerda)
    parts.append(f'<circle cx="{head_x}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')

    # Tronco horizontal
    parts.append(stick_line(head_x+22, head_y, feet_x, head_y, width=14))

    # Pelve
    parts.append(joint(cx-20, head_y, r=8))

    # Braço direito vertical (KB lockout overhead)
    parts.append(stick_line(cx+30, head_y, cx+30, head_y-95, width=8))
    parts.append(stick_line(cx+35, head_y, cx+35, head_y-95, width=8))
    parts.append(joint(cx+30, head_y, r=5))
    parts.append(joint(cx+30, head_y-95, r=5))
    parts.append(kbell(cx+32, head_y-130, scale=0.95, highlight=True))

    # Braço esquerdo ao longo do corpo (grounded para TGU)
    parts.append(stick_line(cx-20, head_y-8, cx-40, head_y-25, width=8))
    parts.append(stick_line(cx-40, head_y-25, head_x+30, head_y-15, width=8))
    parts.append(joint(cx-40, head_y-25, r=5))
    parts.append(stick_line(cx-20, head_y+8, cx-30, head_y+30, width=8))
    parts.append(stick_line(cx-30, head_y+30, head_x+30, head_y+15, width=8))
    parts.append(joint(cx-30, head_y+30, r=5))

    # Pernas esticadas
    parts.append(stick_line(cx-20, head_y, feet_x-30, head_y, width=10))
    parts.append(stick_line(feet_x-30, head_y, feet_x, head_y+20, width=10))  # pé
    parts.append(joint(feet_x-30, head_y, r=6))
    parts.append(joint(feet_x, head_y+20, r=5))

    # Chão
    parts.append(stick_line(50, head_y+50, 350, head_y+50, width=3))

    parts.append(label(cx, head_y-160, "DEITADO — Setup TGU", color=padrao_color))
    # Seta para cima (lockout)
    parts.append(f'<text x="{cx-15}" y="{head_y-110}" font-size="14" fill="{padrao_color}" font-weight="bold">↑ lockout</text>')

    return ''.join(parts)


def template_plank_position(padrao_color, step_num):
    """Prancha: corpo horizontal, apoio nos antebraços."""
    cx = 200
    body_y = 320
    parts = []

    parts.append(plane_ref_horizontal(body_y+50, 30, 370))

    # Cabeça (esquerda)
    parts.append(f'<circle cx="80" cy="{body_y}" r="20" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')

    # Tronco horizontal
    parts.append(stick_line(100, body_y, 280, body_y, width=14))

    # Pelve
    parts.append(joint(180, body_y, r=8))

    # Braço esquerdo no chão (antebraço)
    parts.append(stick_line(135, body_y, 135, body_y+50, width=9))
    parts.append(joint(135, body_y, r=5))
    parts.append(stick_line(135, body_y+50, 100, body_y+50, width=9))
    parts.append(joint(135, body_y+50, r=5))

    # Braço direito (segurando KB no chão ou acima)
    parts.append(stick_line(225, body_y, 225, body_y+50, width=9))
    parts.append(joint(225, body_y, r=5))
    parts.append(stick_line(225, body_y+50, 260, body_y+50, width=9))
    parts.append(joint(225, body_y+50, r=5))

    # KB no chão (no ponto de apoio direito)
    parts.append(kbell(260, body_y+85, scale=0.85))

    # Pernas (esticadas para a direita)
    parts.append(stick_line(255, body_y, 350, body_y, width=10))
    parts.append(stick_line(350, body_y, 360, body_y+30, width=9))
    parts.append(joint(350, body_y, r=6))

    # Chão
    parts.append(stick_line(60, body_y+50, 360, body_y+50, width=3))
    # Label de "linha reta" entre ombro, quadril, joelho (tracejado)
    parts.append(plane_ref_horizontal(body_y, 100, 350, dash=True))

    parts.append(label(200, body_y-25, "PRANCHA — corpo em linha reta", color=padrao_color))
    return ''.join(parts)


def template_flow_position(padrao_color, step_num):
    """Posição genérica para flows/sequências (fallback)."""
    cx = 200
    head_y = 180
    pelvis_y = 380
    parts = []

    parts.append(plane_ref_vertical(200, 140, 530))

    # Cabeça
    parts.append(f'<circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')
    parts.append(stick_line(cx, head_y+22, cx, pelvis_y-15, width=14))
    parts.append(joint(cx, pelvis_y, r=8))

    # Braços em movimento (levemente levantados)
    parts.append(stick_line(cx-2, head_y+30, cx-35, head_y-5, width=7))
    parts.append(stick_line(cx+2, head_y+30, cx+35, head_y-5, width=7))
    parts.append(stick_line(cx-35, head_y-5, cx-50, head_y+50, width=7))
    parts.append(stick_line(cx+35, head_y-5, cx+50, head_y+50, width=7))
    parts.append(joint(cx-35, head_y-5, r=5))
    parts.append(joint(cx+35, head_y-5, r=5))
    # KB na mão direita
    parts.append(kbell(cx+55, head_y+75, scale=0.85))

    parts.append(stick_line(cx-25, pelvis_y, cx-30, pelvis_y+70, width=10))
    parts.append(stick_line(cx+25, pelvis_y, cx+30, pelvis_y+70, width=10))
    parts.append(joint(cx-30, pelvis_y+70, r=6))
    parts.append(joint(cx+30, pelvis_y+70, r=6))
    parts.append(stick_line(cx-30, pelvis_y+70, cx-30, pelvis_y+135, width=9))
    parts.append(stick_line(cx+30, pelvis_y+70, cx+30, pelvis_y+135, width=9))
    parts.append(joint(cx-30, pelvis_y+135, r=5))
    parts.append(joint(cx+30, pelvis_y+135, r=5))

    parts.append(stick_line(cx-50, pelvis_y+145, cx+50, pelvis_y+145, width=3))
    parts.append(label(cx+90, head_y, "FLOW", color=padrao_color))
    return ''.join(parts)


# ====================================================================
# RESOLVER TEMPLATE — decide qual template usar por step
# ====================================================================

def escolher_template(padrao_kb, exercise_id, step_num, total_steps):
    """Resolve qual template usar baseado em padrão KB e step."""
    # Regras por padrão
    if padrao_kb == 'HINGE':
        # step 1 = setup em pé, outros = hinge position
        if step_num == 1:
            return ('stand_upright', {'has_kb': 'no_kb'})
        elif step_num == total_steps:
            # Último step = lockout/stand upright de novo
            return ('stand_upright', {'has_kb': 'no_kb'})
        else:
            return ('hinge_position', {'kb_pos': 'between_legs'})

    elif padrao_kb == 'SQUAT':
        # step 1 = top, último = bottom, meio = bottom (mais tempo embaixo)
        if step_num == 1 or step_num == total_steps and total_steps <= 3:
            return ('squat_top', {})
        elif step_num >= total_steps - 1:
            return ('squat_bottom', {})
        else:
            return ('squat_bottom', {})  # squat é bottom na maioria dos steps

    elif padrao_kb == 'PRESS':
        # step 1 = rack, step 2 = mid, último = lockout
        if step_num == 1:
            return ('stand_upright', {'has_kb': 'rack'})
        elif step_num == total_steps:
            return ('overhead_lockout', {'kb_count': 1})
        else:
            return ('overhead_lockout', {'kb_count': 1})

    elif padrao_kb == 'CARRY':
        # Sempre carry
        side = 'left' if step_num % 2 == 1 else 'right'
        return ('carry_upright', {'side': side})

    elif padrao_kb == 'ROT':
        # TGU/windmill — step 1 = lying, step 2 = standing, step 3+ = standing
        if step_num == 1 and 'tgu' in exercise_id.lower():
            return ('lying_setup', {})
        elif step_num == 1 and 'windmill' in exercise_id.lower():
            return ('stand_upright', {'has_kb': 'no_kb'})
        else:
            return ('stand_upright', {'has_kb': 'rack'})

    elif padrao_kb == 'PULL':
        # step 1 = stand, step 2 = hinge bent over, step 3+ = bent position
        if step_num == 1:
            return ('stand_upright', {'has_kb': 'no_kb'})
        else:
            return ('hinge_position', {'kb_pos': 'between_legs'})

    elif padrao_kb == 'COND':
        # step 1 = stand, step 2-3 = squat/hinge variations
        if step_num == 1:
            return ('stand_upright', {'has_kb': 'no_kb'})
        elif step_num == total_steps and total_steps >= 3:
            return ('plank_position', {})
        else:
            return ('squat_bottom', {})

    elif padrao_kb == 'FLOW':
        # flow position para tudo
        return ('flow_position', {})

    # default
    return ('stand_upright', {'has_kb': 'no_kb'})


# ====================================================================
# FUNÇÃO PRINCIPAL DE GERAÇÃO
# ====================================================================

def generate_avatar(out_path, ex_id, ex_nome, padrao_kb, step_num, total_steps, step_titulo='', vista='FRONTAL'):
    """Gera avatar SVG v2 com anatomia detalhada."""
    padrao_color = PADRAO_CORES.get(padrao_kb, '#10b981')

    # Header + step label + nome + step number
    title_clean = ex_nome
    if len(title_clean) > 30:
        title_clean = title_clean[:28] + '..'

    template_name, template_kwargs = escolher_template(padrao_kb, ex_id, step_num, total_steps)

    template_fn = {
        'stand_upright': template_stand_upright,
        'hinge_position': template_hinge_position,
        'squat_top': template_squat_top,
        'squat_bottom': template_squat_bottom,
        'overhead_lockout': template_overhead_lockout,
        'carry_upright': template_carry_upright,
        'lying_setup': template_lying_setup,
        'plank_position': template_plank_position,
        'flow_position': template_flow_position,
    }[template_name]

    body_content = template_fn(padrao_color, step_num, **template_kwargs)

    # Título limpo sem acento de slug
    import unicodedata
    slug = ''.join(c for c in unicodedata.normalize('NFD', ex_id.replace('kb-', '').lower()) if unicodedata.category(c) != 'Mn')

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
<rect width="400" height="600" fill="{COLORS['bg']}"/>

<!-- Header (cor do padrão) -->
<rect x="0" y="0" width="400" height="60" fill="{padrao_color}"/>
<text x="20" y="25" font-size="14" font-weight="bold" fill="{COLORS['bg']}" font-family="sans-serif">{title_clean.upper()}</text>
<text x="20" y="48" font-size="10" fill="{COLORS['bg']}" opacity="0.7" font-family="sans-serif">{slug}-step-{step_num}</text>

<!-- Step label -->
<circle cx="370" cy="30" r="22" fill="{COLORS['bg']}"/>
<text x="370" y="37" font-size="22" font-weight="bold" fill="{padrao_color}" text-anchor="middle" font-family="sans-serif">{step_num}</text>

<!-- Vista label -->
<rect x="20" y="80" width="80" height="20" rx="4" fill="{COLORS['label_bg']}" stroke="{padrao_color}" stroke-width="1"/>
<text x="60" y="94" font-size="10" font-weight="bold" fill="{padrao_color}" text-anchor="middle" font-family="sans-serif">{vista}</text>

<!-- Title do step -->
<text x="115" y="95" font-size="14" font-weight="bold" fill="{COLORS['text_primary']}" font-family="sans-serif">{step_titulo[:35]}</text>

<!-- Corpo do avatar -->
<g transform="translate(0, 50)">
{body_content}
</g>

<!-- Footer label -->
<rect x="0" y="560" width="400" height="40" fill="{padrao_color}" opacity="0.15"/>
<text x="20" y="578" font-size="11" font-weight="bold" fill="{padrao_color}" font-family="sans-serif">▶ Anatomia</text>
<text x="20" y="592" font-size="10" fill="{COLORS['text_secondary']}" font-family="sans-serif">• Articulações em amarelo • KB com alça • Vista {vista}</text>

<!-- Tag PASSO N no canto -->
<g transform="translate(330, 80)">
<rect x="0" y="0" width="50" height="22" rx="11" fill="{padrao_color}"/>
<text x="25" y="15" font-size="11" font-weight="bold" fill="{COLORS['bg']}" text-anchor="middle" font-family="sans-serif">PASSO {step_num}</text>
</g>
</svg>'''

    Path(out_path).write_text(svg)
    return out_path


# ====================================================================
# LER SEED E GERAR
# ====================================================================

if __name__ == '__main__':
    seed_path = 'frontend/src/data/seed/exercicios-kettlebell.ts'
    out_dir = 'frontend/public/kettlebell/avatars'

    print('Lendo seed...')
    with open(seed_path, 'r') as f:
        content = f.read()

    chunks = re.split(r"(?=    id: 'kb-)", content)

    total_ex = 0
    total_avatars = 0
    errors = []

    for chunk in chunks:
        if 'id: \'kb-' not in chunk:
            continue

        ex_id_match = re.search(r"\bid:\s*'(kb-[^']+)'", chunk)
        nome_match = re.search(r"\bnome:\s*'([^']+)'", chunk)
        padrao_match = re.search(r"\bpadraoKb:\s*'([^']+)'", chunk)

        if not (ex_id_match and nome_match and padrao_match):
            continue

        ex_id = ex_id_match.group(1)
        ex_nome = nome_match.group(1)
        padrao = padrao_match.group(1)

        # Parse steps
        step_pattern = r"\{\s*numero:\s*(\d+),\s*titulo:\s*'([^']+)'"
        steps = []
        for m in re.finditer(step_pattern, chunk):
            steps.append((int(m.group(1)), m.group(2)))

        if not steps:
            continue

        total_ex += 1
        for step_num, step_titulo in steps:
            out_path = f'{out_dir}/{ex_id}-step-{step_num}.svg'
            try:
                generate_avatar(out_path, ex_id, ex_nome, padrao, step_num, len(steps), step_titulo=step_titulo)
                total_avatars += 1
            except Exception as e:
                errors.append(f'{ex_id}-step-{step_num}: {e}')

    print(f'\n✅ Exercícios: {total_ex}')
    print(f'✅ Avatares gerados: {total_avatars}')
    if errors:
        print(f'\n❌ Erros: {len(errors)}')
        for e in errors[:5]:
            print(f'  {e}')
