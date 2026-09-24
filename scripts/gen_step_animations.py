"""
Gera SVGs animados (SMIL) com keyframes REAIS para cada step.
Sprint 76 — Animação com movimento físico, não só opacity.
"""

import re
import os
import sys
import math
from pathlib import Path

# Importar templates do regen_avatars
sys.path.insert(0, os.path.dirname(__file__))
import regen_avatars
from regen_avatars import (
    escolher_template, PADRAO_CORES,
    COLORS, joint, stick_line, kbell, label,
    plane_ref_vertical, plane_ref_horizontal, angle_arc, angle_label,
)


def gen_anim_swing(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo, duracao=4):
    """Animação de SWING: quadril vai para trás → frente → trás."""
    padrao_color = PADRAO_CORES['HINGE']

    # 2 frames: posição A (setup) e B (backswing/full)
    # Usar 4 frames: setup, mid-back, top, mid-front
    cx = 200
    head_y = 200
    parts = []

    # Frame estático (vamos animar a parte do quadril e KB)
    # ... (stick figure base em pé)
    # Para simplificar, vamos animar o quadril subindo/descendo

    # Plano de referência (vertical)
    parts.append(plane_ref_vertical(200, 150, 530))

    # Cabeça fixa
    parts.append(f'<circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')

    # Tronco: animar rotação do quadril (pivô em pé)
    # Inicialmente com inclinação frontal, depois vai para trás
    # Vamos usar animateTransform para inclinar
    parts.append(f'''
<g id="trunk">
  <animateTransform attributeName="transform" type="rotate"
    values="0 {cx} {head_y+22}; -45 {cx} {head_y+22}; -90 {cx} {head_y+22}; -45 {cx} {head_y+22}; 0 {cx} {head_y+22}"
    keyTimes="0;0.25;0.5;0.75;1"
    dur="{duracao}s" repeatCount="indefinite"/>
  <line x1="{cx}" y1="{head_y+22}" x2="{cx}" y2="400" stroke="{COLORS["stick"]}" stroke-width="14" stroke-linecap="round"/>
  <line x1="{cx}" y1="260" x2="200" y2="320" stroke="{COLORS["stick"]}" stroke-width="10" stroke-linecap="round"/>
  <line x1="{cx}" y1="260" x2="220" y2="320" stroke="{COLORS["stick"]}" stroke-width="10" stroke-linecap="round"/>
</g>
''')
    # Articulações do quadril (animadas junto)
    parts.append(f'''
<g>
  <animateTransform attributeName="transform" type="translate"
    values="0,0; 0,-30; 0,-50; 0,-30; 0,0"
    keyTimes="0;0.25;0.5;0.75;1"
    dur="{duracao}s" repeatCount="indefinite"/>
  <circle cx="{cx}" cy="400" r="8" fill="{COLORS["bg"]}" stroke="{COLORS["joint_emphasis"]}" stroke-width="2.5"/>
  <circle cx="{cx}" cy="400" r="5.5" fill="{COLORS["joint_emphasis"]}" opacity="0.7"/>
</g>
''')

    # KB que balança junto com tronco
    parts.append(f'''
<g>
  <animateTransform attributeName="transform" type="translate"
    values="0,0; 30,-30; 50,-100; 30,-30; 0,0"
    keyTimes="0;0.25;0.5;0.75;1"
    dur="{duracao}s" repeatCount="indefinite"/>
  {kbell(cx+50, head_y+220, scale=0.85)}
</g>
''')

    # Seta indicando direção do movimento
    parts.append(f'<text x="320" y="250" font-size="40" fill="{padrao_color}" opacity="0.4" font-weight="bold">↻</text>')

    svg = wrap_svg_animation(parts, ex_id, ex_nome, step_num, step_titulo, padrao_color, duracao, 'HINGE')
    Path(out_path).write_text(svg)
    return out_path


def gen_anim_press(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo, duracao=4):
    """Animação de PRESS: rack → overhead."""
    padrao_color = PADRAO_CORES['PRESS']
    cx = 200
    head_y = 200
    parts = []

    parts.append(plane_ref_vertical(200, 130, 530))

    # Cabeça + tronco
    parts.append(f'<circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')
    parts.append(stick_line(cx, head_y+22, cx, 400, width=14))
    parts.append(joint(cx, 400, r=8))

    # Braço direito animado (ramp → overhead)
    parts.append(f'''
<g>
  <animateTransform attributeName="transform" type="rotate"
    values="0 {cx+2} {head_y+30}; -30 {cx+2} {head_y+30}; -90 {cx+2} {head_y+30}; -150 {cx+2} {head_y+30}; -180 {cx+2} {head_y+30}; -180 {cx+2} {head_y+30}; -150 {cx+2} {head_y+30}; -90 {cx+2} {head_y+30}; -30 {cx+2} {head_y+30}; 0 {cx+2} {head_y+30}"
    keyTimes="0;0.1;0.2;0.3;0.4;0.5;0.6;0.7;0.8;0.9;1"
    dur="{duracao}s" repeatCount="indefinite"/>
  <line x1="{cx+2}" y1="{head_y+30}" x2="{cx+25}" y2="{head_y+30}" stroke="{COLORS["stick"]}" stroke-width="8" stroke-linecap="round"/>
  <line x1="{cx+25}" y1="{head_y+30}" x2="{cx+25}" y2="{head_y+30}" stroke="{COLORS["stick"]}" stroke-width="8" stroke-linecap="round"/>
  <circle cx="{cx+25}" cy="{head_y+30}" r="5" fill="{COLORS["bg"]}" stroke="{COLORS["joint_default"]}" stroke-width="2.5"/>
  <circle cx="{cx+25}" cy="{head_y+30}" r="2.5" fill="{COLORS["joint_default"]}" opacity="0.7"/>
</g>
''')

    # KB indo junto (com cotovelo e mão)
    parts.append(f'''
<g>
  <animateTransform attributeName="transform" type="rotate"
    values="0 {cx+2} {head_y+30}; -30 {cx+2} {head_y+30}; -90 {cx+2} {head_y+30}; -150 {cx+2} {head_y+30}; -180 {cx+2} {head_y+30}; -180 {cx+2} {head_y+30}; -150 {cx+2} {head_y+30}; -90 {cx+2} {head_y+30}; -30 {cx+2} {head_y+30}; 0 {cx+2} {head_y+30}"
    keyTimes="0;0.1;0.2;0.3;0.4;0.5;0.6;0.7;0.8;0.9;1"
    dur="{duracao}s" repeatCount="indefinite"/>
  <line x1="{cx+25}" y1="{head_y+30}" x2="{cx+25}" y2="{head_y-30}" stroke="{COLORS["stick"]}" stroke-width="8" stroke-linecap="round"/>
  {kbell(cx+25, head_y-65, scale=0.9, highlight=True)}
</g>
''')

    # Pernas em pé (fixas)
    parts.append(stick_line(cx-25, 400, cx-30, 470, width=10))
    parts.append(stick_line(cx+25, 400, cx+30, 470, width=10))
    parts.append(joint(cx-30, 470, r=6))
    parts.append(joint(cx+30, 470, r=6))
    parts.append(stick_line(cx-30, 470, cx-30, 535, width=9))
    parts.append(stick_line(cx+30, 470, cx+30, 535, width=9))
    parts.append(joint(cx-30, 535, r=5))
    parts.append(joint(cx+30, 535, r=5))
    parts.append(stick_line(cx-50, 545, cx+50, 545, width=3))

    # Label ângulo
    parts.append(angle_arc(cx+25, head_y+30, 25, -180, -90))
    parts.append(angle_label(cx+45, head_y-15, "180°", color=padrao_color))

    # Seta de progresso
    parts.append(f'<text x="320" y="250" font-size="40" fill="{padrao_color}" opacity="0.4" font-weight="bold">↑</text>')

    svg = wrap_svg_animation(parts, ex_id, ex_nome, step_num, step_titulo, padrao_color, duracao, 'PRESS')
    Path(out_path).write_text(svg)
    return out_path


def gen_anim_squat(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo, duracao=4):
    """Animação de SQUAT: em pé → agachado → em pé."""
    padrao_color = PADRAO_CORES['SQUAT']
    cx = 200
    head_y_initial = 170
    head_y_bottom = 270
    parts = []

    parts.append(plane_ref_vertical(200, 130, 530))

    # Stick figure animado
    parts.append(f'''
<g id="squat">
  <!-- Cabeça -->
  <animateTransform attributeName="transform" type="translate"
    values="0,0; 0,100; 0,100; 0,0"
    keyTimes="0;0.4;0.6;1"
    dur="{duracao}s" repeatCount="indefinite"/>
  <circle cx="{cx}" cy="{head_y_initial}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>

  <!-- Tronco -->
  <line x1="{cx}" y1="192" x2="{cx}" y2="380" stroke="{COLORS["stick"]}" stroke-width="14" stroke-linecap="round"/>
  <circle cx="{cx}" cy="380" r="8" fill="{COLORS["bg"]}" stroke="{COLORS["joint_emphasis"]}" stroke-width="2.5"/>
  <circle cx="{cx}" cy="380" r="5.5" fill="{COLORS["joint_emphasis"]}" opacity="0.7"/>

  <!-- Coxas (animadas: paralelas ao chão quando baixo) -->
  <line x1="{cx}" y1="380" x2="{cx+50}" y2="395" stroke="{COLORS["stick"]}" stroke-width="10" stroke-linecap="round">
    <animate attributeName="x2" values="{cx+30};{cx+50};{cx+50};{cx+30}" keyTimes="0;0.4;0.6;1" dur="{duracao}s" repeatCount="indefinite"/>
    <animate attributeName="y2" values="385;395;395;385" keyTimes="0;0.4;0.6;1" dur="{duracao}s" repeatCount="indefinite"/>
  </line>
  <line x1="{cx}" y1="380" x2="{cx-50}" y2="395" stroke="{COLORS["stick"]}" stroke-width="10" stroke-linecap="round">
    <animate attributeName="x2" values="{cx-30};{cx-50};{cx-50};{cx-30}" keyTimes="0;0.4;0.6;1" dur="{duracao}s" repeatCount="indefinite"/>
    <animate attributeName="y2" values="385;395;395;385" keyTimes="0;0.4;0.6;1" dur="{duracao}s" repeatCount="indefinite"/>
  </line>

  <!-- Joelhos -->
  <circle cx="{cx+30}" cy="385" r="6" fill="{COLORS["bg"]}" stroke="{COLORS["joint_emphasis"]}" stroke-width="2.5">
    <animate attributeName="cx" values="{cx+30};{cx+50};{cx+50};{cx+30}" keyTimes="0;0.4;0.6;1" dur="{duracao}s" repeatCount="indefinite"/>
  </circle>
  <circle cx="{cx-30}" cy="385" r="6" fill="{COLORS["bg"]}" stroke="{COLORS["joint_emphasis"]}" stroke-width="2.5">
    <animate attributeName="cx" values="{cx-30};{cx-50};{cx-50};{cx-30}" keyTimes="0;0.4;0.6;1" dur="{duracao}s" repeatCount="indefinite"/>
  </circle>
</g>
''')

    # Setas indicando descida
    parts.append(f'<text x="80" y="220" font-size="40" fill="{padrao_color}" opacity="0.4" font-weight="bold">↓↑</text>')

    # Pernas em pé (fixas)
    parts.append(stick_line(cx-30, 385, cx-30, 535, width=9))
    parts.append(stick_line(cx+30, 385, cx+30, 535, width=9))
    parts.append(joint(cx-30, 535, r=5))
    parts.append(joint(cx+30, 535, r=5))

    # Chão
    parts.append(stick_line(cx-50, 545, cx+50, 545, width=3))

    svg = wrap_svg_animation(parts, ex_id, ex_nome, step_num, step_titulo, padrao_color, duracao, 'SQUAT')
    Path(out_path).write_text(svg)
    return out_path


def gen_anim_carry(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo, duracao=4):
    """Animação de CARRY: stick figure deslizando horizontalmente."""
    padrao_color = PADRAO_CORES['CARRY']
    cx_initial = 100
    parts = []

    # Stick figure inteiro animado
    parts.append(f'''
<g>
  <animateTransform attributeName="transform" type="translate"
    values="0,0; 200,0; 200,0; 0,0"
    keyTimes="0;0.45;0.55;1"
    dur="{duracao}s" repeatCount="indefinite"/>
  <circle cx="{cx_initial}" cy="170" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>
  <line x1="{cx_initial}" y1="192" x2="{cx_initial}" y2="380" stroke="{COLORS["stick"]}" stroke-width="14" stroke-linecap="round"/>
  <circle cx="{cx_initial}" cy="380" r="8" fill="{COLORS["bg"]}" stroke="{COLORS["joint_emphasis"]}" stroke-width="2.5"/>
  <!-- Braço com KB -->
  <line x1="{cx_initial-2}" y1="200" x2="{cx_initial-30}" y2="250" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <line x1="{cx_initial-30}" y1="250" x2="{cx_initial-30}" y2="320" stroke="{COLORS["stick"]}" stroke-width="8"/>
  {kbell(cx_initial-30, 350, scale=1.0)}
  <!-- Pernas -->
  <line x1="{cx_initial-25}" y1="380" x2="{cx_initial-30}" y2="450" stroke="{COLORS["stick"]}" stroke-width="10"/>
  <line x1="{cx_initial+25}" y1="380" x2="{cx_initial+30}" y2="450" stroke="{COLORS["stick"]}" stroke-width="10"/>
  <line x1="{cx_initial-30}" y1="450" x2="{cx_initial-30}" y2="535" stroke="{COLORS["stick"]}" stroke-width="9"/>
  <line x1="{cx_initial+30}" y1="450" x2="{cx_initial+30}" y2="535" stroke="{COLORS["stick"]}" stroke-width="9"/>
</g>
''')

    # Setas de movimento (estáticas)
    parts.append(f'<text x="200" y="300" font-size="60" fill="{padrao_color}" opacity="0.3" font-weight="bold" text-anchor="middle">→ → →</text>')

    # Chão
    parts.append(stick_line(50, 545, 350, 545, width=3))

    svg = wrap_svg_animation(parts, ex_id, ex_nome, step_num, step_titulo, padrao_color, duracao, 'CARRY')
    Path(out_path).write_text(svg)
    return out_path


def gen_anim_rotate(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo, duracao=4):
    """Animação de ROT: TGU-like — deitado → sentado → em pé."""
    padrao_color = PADRAO_CORES['ROT']
    parts = []

    # Frame estático em pose final (em pé com KB overhead)
    cx = 200
    head_y = 250

    # Barra de movimento progressivo
    parts.append(f'''
<g id="tgu">
  <!-- TGU progressão: deitado → sentado → joelho → em pé -->
  <animateTransform attributeName="transform" type="rotate"
    values="0 200 280; -45 200 280; -90 200 280; -90 200 280; 0 200 280"
    keyTimes="0;0.25;0.5;0.75;1"
    dur="{duracao}s" repeatCount="indefinite"/>
  <line x1="60" y1="350" x2="340" y2="350" stroke="{COLORS["stick"]}" stroke-width="14" stroke-linecap="round"/>
  <circle cx="80" cy="350" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>
  <line x1="340" y1="350" x2="340" y2="180" stroke="{COLORS["stick"]}" stroke-width="8" stroke-linecap="round"/>
  {kbell(340, 130, scale=0.95, highlight=True)}
</g>
''')

    # Plano de referência horizontal
    parts.append(plane_ref_horizontal(380, 30, 370, dash=True))

    parts.append(f'<text x="320" y="450" font-size="40" fill="{padrao_color}" opacity="0.4" font-weight="bold">↻</text>')

    svg = wrap_svg_animation(parts, ex_id, ex_nome, step_num, step_titulo, padrao_color, duracao, 'ROT')
    Path(out_path).write_text(svg)
    return out_path


def gen_anim_pull(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo, duracao=4):
    """Animação de PULL: row — braço puxa KB em direção ao peito."""
    padrao_color = PADRAO_CORES['PULL']
    cx = 200
    head_y = 170
    parts = []

    parts.append(plane_ref_vertical(200, 130, 530))

    # Cabeça + tronco
    parts.append(f'<circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>')
    # Tronco levemente inclinado
    parts.append(stick_line(cx, head_y+22, cx-10, 380, width=14))
    parts.append(joint(cx-10, 380, r=8))

    # Braço animado: extendido → contraído
    parts.append(f'''
<g>
  <animateTransform attributeName="transform" type="translate"
    values="0,0; -40,-50; -40,-50; 0,0"
    keyTimes="0;0.25;0.75;1"
    dur="{duracao}s" repeatCount="indefinite"/>
  <line x1="{cx}" y1="{head_y+50}" x2="{cx-30}" y2="300" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <line x1="{cx-30}" y1="300" x2="{cx-30}" y2="370" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <circle cx="{cx-30}" cy="300" r="5" fill="{COLORS["bg"]}" stroke="{COLORS["joint_default"]}" stroke-width="2.5"/>
  {kbell(cx-30, 400, scale=0.85)}
</g>
''')

    # Outro braço (estático)
    parts.append(stick_line(cx+2, head_y+30, cx+25, head_y+90, width=7))
    parts.append(stick_line(cx+25, head_y+90, cx+25, head_y+150, width=7))
    parts.append(joint(cx+25, head_y+90, r=5))

    # Pernas
    parts.append(stick_line(cx-25, 380, cx-30, 450, width=10))
    parts.append(stick_line(cx+25, 380, cx+30, 450, width=10))
    parts.append(stick_line(cx-30, 450, cx-30, 535, width=9))
    parts.append(stick_line(cx+30, 450, cx+30, 535, width=9))
    parts.append(joint(cx-30, 535, r=5))
    parts.append(joint(cx+30, 535, r=5))

    parts.append(stick_line(cx-50, 545, cx+50, 545, width=3))

    # Setas indicando pull
    parts.append(f'<text x="80" y="280" font-size="50" fill="{padrao_color}" opacity="0.4" font-weight="bold">←←</text>')

    svg = wrap_svg_animation(parts, ex_id, ex_nome, step_num, step_titulo, padrao_color, duracao, 'PULL')
    Path(out_path).write_text(svg)
    return out_path


def gen_anim_flow(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo, duracao=4):
    """Animação FLOW: rotação suave 360° do stick."""
    padrao_color = PADRAO_CORES['FLOW']
    cx = 200
    head_y = 200
    parts = []

    parts.append(plane_ref_vertical(200, 130, 530))

    # Stick figure animado: rotaciona 360° ao redor do centro vertical
    parts.append(f'''
<g>
  <animateTransform attributeName="transform" type="rotate"
    values="0 200 280; 360 200 280"
    keyTimes="0;1"
    dur="{duracao}s" repeatCount="indefinite"/>
  <circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>
  <line x1="{cx}" y1="{head_y+22}" x2="{cx}" y2="380" stroke="{COLORS["stick"]}" stroke-width="14" stroke-linecap="round"/>
  <circle cx="{cx}" cy="380" r="8" fill="{COLORS["bg"]}" stroke="{COLORS["joint_emphasis"]}" stroke-width="2.5"/>
  <!-- Braços -->
  <line x1="{cx-2}" y1="{head_y+30}" x2="{cx-35}" y2="250" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <line x1="{cx+2}" y1="{head_y+30}" x2="{cx+35}" y2="250" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <line x1="{cx-35}" y1="250" x2="{cx-50}" y2="320" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <line x1="{cx+35}" y1="250" x2="{cx+50}" y2="320" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <!-- Pernas -->
  <line x1="{cx-25}" y1="380" x2="{cx-30}" y2="450" stroke="{COLORS["stick"]}" stroke-width="10"/>
  <line x1="{cx+25}" y1="380" x2="{cx+30}" y2="450" stroke="{COLORS["stick"]}" stroke-width="10"/>
  <line x1="{cx-30}" y1="450" x2="{cx-30}" y2="535" stroke="{COLORS["stick"]}" stroke-width="9"/>
  <line x1="{cx+30}" y1="450" x2="{cx+30}" y2="535" stroke="{COLORS["stick"]}" stroke-width="9"/>
</g>
''')

    parts.append(stick_line(cx-50, 545, cx+50, 545, width=3))
    parts.append(f'<text x="320" y="450" font-size="40" fill="{padrao_color}" opacity="0.4" font-weight="bold">↻</text>')

    svg = wrap_svg_animation(parts, ex_id, ex_nome, step_num, step_titulo, padrao_color, duracao, 'FLOW')
    Path(out_path).write_text(svg)
    return out_path


def gen_anim_cond(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo, duracao=3):
    """Animação COND: pulse (batimento cardíaco)."""
    padrao_color = PADRAO_CORES['COND']
    cx = 200
    head_y = 200
    parts = []

    parts.append(plane_ref_vertical(200, 130, 530))

    # Stick figure com scale pulse
    parts.append(f'''
<g>
  <animateTransform attributeName="transform" type="scale"
    values="1;1.1;1;1.1;1"
    keyTimes="0;0.25;0.5;0.75;1"
    dur="{duracao}s" repeatCount="indefinite"
    additive="sum"/>
  <circle cx="{cx}" cy="{head_y}" r="22" fill="{COLORS["stick"]}" stroke="{COLORS["bg"]}" stroke-width="1.5"/>
  <line x1="{cx}" y1="{head_y+22}" x2="{cx}" y2="380" stroke="{COLORS["stick"]}" stroke-width="14" stroke-linecap="round"/>
  <circle cx="{cx}" cy="380" r="8" fill="{COLORS["bg"]}" stroke="{COLORS["joint_emphasis"]}" stroke-width="2.5"/>
  <line x1="{cx-2}" y1="{head_y+30}" x2="{cx-25}" y2="{head_y+90}" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <line x1="{cx+2}" y1="{head_y+30}" x2="{cx+25}" y2="{head_y+90}" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <line x1="{cx-25}" y1="{head_y+90}" x2="{cx-25}" y2="{head_y+150}" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <line x1="{cx+25}" y1="{head_y+90}" x2="{cx+25}" y2="{head_y+150}" stroke="{COLORS["stick"]}" stroke-width="8"/>
  <line x1="{cx-25}" y1="380" x2="{cx-30}" y2="450" stroke="{COLORS["stick"]}" stroke-width="10"/>
  <line x1="{cx+25}" y1="380" x2="{cx+30}" y2="450" stroke="{COLORS["stick"]}" stroke-width="10"/>
  <line x1="{cx-30}" y1="450" x2="{cx-30}" y2="535" stroke="{COLORS["stick"]}" stroke-width="9"/>
  <line x1="{cx+30}" y1="450" x2="{cx+30}" y2="535" stroke="{COLORS["stick"]}" stroke-width="9"/>
</g>
''')

    parts.append(stick_line(cx-50, 545, cx+50, 545, width=3))

    # Seta de batimento cardíaco
    parts.append(f'<text x="320" y="280" font-size="50" fill="{padrao_color}" opacity="0.4" font-weight="bold">♥</text>')

    svg = wrap_svg_animation(parts, ex_id, ex_nome, step_num, step_titulo, padrao_color, duracao, 'COND')
    Path(out_path).write_text(svg)
    return out_path


def wrap_svg_animation(body_content, ex_id, ex_nome, step_num, step_titulo, padrao_color, duracao, padrao_kb):
    """Wrapper do SVG com header + footer + animations."""
    import unicodedata
    slug = ''.join(c for c in unicodedata.normalize('NFD', ex_id.replace('kb-', '').lower()) if unicodedata.category(c) != 'Mn')
    title_clean = ex_nome
    if len(title_clean) > 30:
        title_clean = title_clean[:28] + '..'

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
<rect width="400" height="600" fill="{COLORS['bg']}"/>

<!-- Header -->
<rect x="0" y="0" width="400" height="60" fill="{padrao_color}"/>
<text x="20" y="25" font-size="14" font-weight="bold" fill="{COLORS['bg']}" font-family="sans-serif">{title_clean.upper()}</text>
<text x="20" y="48" font-size="10" fill="{COLORS['bg']}" opacity="0.7" font-family="sans-serif">{slug}-step-{step_num}</text>

<!-- Step number -->
<circle cx="370" cy="30" r="22" fill="{COLORS['bg']}"/>
<text x="370" y="37" font-size="22" font-weight="bold" fill="{padrao_color}" text-anchor="middle" font-family="sans-serif">{step_num}</text>

<!-- Vista + título -->
<rect x="20" y="80" width="80" height="20" rx="4" fill="{COLORS['label_bg']}" stroke="{padrao_color}" stroke-width="1"/>
<text x="60" y="94" font-size="10" font-weight="bold" fill="{padrao_color}" text-anchor="middle" font-family="sans-serif">VISTA FRONTAL</text>
<text x="115" y="95" font-size="14" font-weight="bold" fill="{COLORS['text_primary']}" font-family="sans-serif">{step_titulo[:35]}</text>

<!-- Corpo -->
<g transform="translate(0, 50)">
{''.join(body_content)}
</g>

<!-- Footer -->
<rect x="0" y="560" width="400" height="40" fill="{padrao_color}" opacity="0.15"/>
<text x="20" y="578" font-size="11" font-weight="bold" fill="{padrao_color}" font-family="sans-serif">▶ Animação ({duracao}s loop)</text>
<text x="20" y="592" font-size="10" fill="{COLORS['text_secondary']}" font-family="sans-serif">• Movimento físico real • Loop contínuo</text>

<!-- Tag PASSO N -->
<g transform="translate(330, 80)">
<rect x="0" y="0" width="50" height="22" rx="11" fill="{padrao_color}"/>
<text x="25" y="15" font-size="11" font-weight="bold" fill="{COLORS['bg']}" text-anchor="middle" font-family="sans-serif">PASSO {step_num}</text>
</g>
</svg>'''
    return svg


def generate_animation(out_path, ex_id, ex_nome, padrao, step_num, total_steps, step_titulo):
    """Escolhe o gerador certo baseado no padrão."""
    if padrao == 'HINGE':
        return gen_anim_swing(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo)
    elif padrao == 'SQUAT':
        return gen_anim_squat(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo)
    elif padrao == 'PRESS':
        return gen_anim_press(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo)
    elif padrao == 'PULL':
        return gen_anim_pull(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo)
    elif padrao == 'CARRY':
        return gen_anim_carry(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo)
    elif padrao == 'ROT':
        return gen_anim_rotate(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo)
    elif padrao == 'COND':
        return gen_anim_cond(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo)
    elif padrao == 'FLOW':
        return gen_anim_flow(out_path, ex_id, ex_nome, step_num, total_steps, step_titulo)
    return None


if __name__ == '__main__':
    seed_path = 'frontend/src/data/seed/exercicios-kettlebell.ts'
    out_dir = 'frontend/public/kettlebell/step-anim'

    os.makedirs(out_dir, exist_ok=True)

    print('Lendo seed...')
    with open(seed_path) as f:
        content = f.read()

    chunks = re.split(r"(?=    id: 'kb-)", content)

    total_ex = 0
    total_steps = 0
    errors = []

    for chunk in chunks:
        if 'id: \'kb-' not in chunk:
            continue

        ex_id_match = re.search(r"id:\s*'(kb-[^']+)'", chunk)
        nome_match = re.search(r"nome:\s*'([^']+)'", chunk)
        padrao_match = re.search(r"padraoKb:\s*'([^']+)'", chunk)

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
                result = generate_animation(out_path, ex_id, ex_nome, padrao, step_num, len(steps), step_titulo)
                if result:
                    total_steps += 1
                else:
                    errors.append(f'{ex_id}-step-{step_num}: padrão {padrao} sem animação')
            except Exception as e:
                errors.append(f'{ex_id}-step-{step_num}: {e}')

    print(f'\n✅ Exercícios: {total_ex}')
    print(f'✅ Steps animados (com movimento real): {total_steps}')
    if errors:
        print(f'\n⚠️  Erros: {len(errors)}')
        for e in errors[:5]:
            print(f'  {e}')
