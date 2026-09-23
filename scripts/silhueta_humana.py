"""
Silhueta humana SVG — corpo inteiro frontal e lateral.
Usada pelo regen_step_images.py para destacar músculos.

Músculos disponíveis (todos retornam (SVG_path_d, cor_default)):
- gluteo_maximo (verde)
- isquiotibial (verde claro)
- quadriceps (laranja)
- deltoide (roxo)
- peitoral (ciano)
- latissimo (ciano)
- trapezio (roxo)
- core / abdomen (pink)
- obliquo (pink)
- triceps (ciano)
- biceps (cyan)
- lombar (pink)
- antebraco (azul)
- panturrilha (laranja)
"""

# === SILHUETA FRONTAL ===
# Vista frontal: cabeça em cima, pés embaixo, braços ao lado
SILHUETA_FRONTAL = {
    "width": 480,
    "height": 1080,
    "musculos": {
        "gluteo_maximo": {
            "color": "#10b981",  # verde
            "path": "M 180 720 Q 240 700 300 720 Q 310 800 240 820 Q 170 800 180 720 Z",
            "label_x": 350,
            "label_y": 770,
            "label": "GLÚTEO MÁXIMO (bumbum)",
        },
        "isquiotibial": {
            "color": "#22c55e",  # verde claro
            "path": "M 195 600 Q 230 595 260 600 L 270 700 Q 240 705 200 700 Z",
            "label_x": 350,
            "label_y": 650,
            "label": "ISQUIOTIBIAL (parte de trás da coxa)",
        },
        "quadriceps": {
            "color": "#f59e0b",  # laranja
            "path": "M 180 580 Q 230 575 280 580 L 290 720 Q 240 725 190 720 Z",
            "label_x": 350,
            "label_y": 650,
            "label": "QUADRÍCEPS (frente da coxa)",
        },
        "panturrilha": {
            "color": "#fb923c",  # laranja claro
            "path": "M 200 870 Q 240 865 280 870 L 285 970 Q 240 980 195 970 Z",
            "label_x": 350,
            "label_y": 920,
            "label": "PANTURRILHA",
        },
        "deltoide": {
            "color": "#a855f7",  # roxo
            "path": "M 130 280 Q 160 270 200 280 Q 205 320 200 340 L 160 345 Q 130 340 125 320 Z",
            "label_x": 60,
            "label_y": 305,
            "label": "DELTÓIDE (ombro)",
        },
        "peitoral": {
            "color": "#06b6d4",  # ciano
            "path": "M 175 360 Q 230 350 285 360 L 290 410 Q 230 425 170 410 Z",
            "label_x": 350,
            "label_y": 385,
            "label": "PEITORAL (peito)",
        },
        "biceps": {
            "color": "#22d3ee",  # ciano claro
            "path": "M 145 360 Q 165 358 180 360 L 178 440 Q 160 442 145 440 Z",
            "label_x": 60,
            "label_y": 400,
            "label": "BÍCEPS",
        },
        "triceps": {
            "color": "#0891b2",  # ciano escuro
            "path": "M 285 360 Q 305 358 320 360 L 322 440 Q 305 442 285 440 Z",
            "label_x": 350,
            "label_y": 400,
            "label": "TRÍCEPS",
        },
        "antebraco": {
            "color": "#0284c7",  # azul
            "path": "M 145 440 Q 165 438 180 440 L 178 510 Q 160 512 145 510 Z",
            "label_x": 60,
            "label_y": 475,
            "label": "ANTEBRAÇO/GRIP",
        },
        "core": {  # abdômen
            "color": "#ec4899",  # pink
            "path": "M 195 440 Q 240 430 285 440 L 290 560 Q 240 575 190 560 Z",
            "label_x": 350,
            "label_y": 500,
            "label": "CORE / ABDÔMEN (barriga)",
        },
        "obliquo": {
            "color": "#db2777",  # pink escuro
            "path": "M 175 460 L 195 455 L 195 560 L 175 555 Z",
            "label_x": 60,
            "label_y": 510,
            "label": "OBLÍQUO (lateral)",
        },
        "lombar": {  # visível só na lateral
            "color": "#be185d",  # dark pink
            "path": "M 195 460 Q 240 470 285 460 L 290 540 Q 240 555 190 540 Z",
            "label_x": 350,
            "label_y": 500,
            "label": "LOMBAR",
        },
    },
}


def get_silhueta(vista: str = "frontal"):
    """Retorna dict com width, height, músculos. Vista pode ser frontal ou lateral."""
    if vista == "lateral":
        return SILHUETA_LATERAL
    return SILHUETA_FRONTAL


# === SILHUETA LATERAL ===
SILHUETA_LATERAL = {
    "width": 480,
    "height": 1080,
    "musculos": {
        "gluteo_maximo": {
            "color": "#10b981",
            "path": "M 180 720 Q 240 700 300 720 Q 310 800 240 820 Q 170 800 180 720 Z",
            "label_x": 350,
            "label_y": 770,
            "label": "GLÚTEO MÁXIMO (bumbum)",
        },
        "isquiotibial": {
            "color": "#22c55e",
            "path": "M 195 600 Q 230 595 260 600 L 270 700 Q 240 705 200 700 Z",
            "label_x": 350,
            "label_y": 650,
            "label": "ISQUIOTIBIAL (parte de trás da coxa)",
        },
        "quadriceps": {
            "color": "#f59e0b",
            "path": "M 180 580 Q 230 575 280 580 L 290 720 Q 240 725 190 720 Z",
            "label_x": 350,
            "label_y": 650,
            "label": "QUADRÍCEPS (frente da coxa)",
        },
        "panturrilha": {
            "color": "#fb923c",
            "path": "M 200 870 Q 240 865 280 870 L 285 970 Q 240 980 195 970 Z",
            "label_x": 350,
            "label_y": 920,
            "label": "PANTURRILHA",
        },
        "lombar": {
            "color": "#be185d",
            "path": "M 200 440 L 280 440 L 285 540 Q 240 555 195 540 Z",
            "label_x": 350,
            "label_y": 490,
            "label": "LOMBAR (parte baixa das costas)",
        },
        "core": {
            "color": "#ec4899",
            "path": "M 200 440 L 280 440 L 280 470 L 200 470 Z",
            "label_x": 350,
            "label_y": 455,
            "label": "CORE (barriga)",
        },
    },
}


# === MAPEAMENTO POR PADRÃO KB ===
# Cada padrão KB tem lista de prioridade de músculos a destacar
PADRAO_MUSCULOS = {
    "HINGE": ["gluteo_maximo", "isquiotibial"],  # Deadlift, Swing, Good Morning
    "SQUAT": ["quadriceps", "gluteo_maximo"],  # Goblet, Front, Lunge
    "PRESS": ["deltoide", "triceps", "core"],  # Press, Push Press, Jerk
    "PULL": ["latissimo", "biceps", "antebraco"],  # Rows, Pull-up
    "CARRY": ["antebraco", "core", "deltoide"],  # Farmer Carry, Waiter Walk
    "ROT": ["core", "obliquo", "deltoide"],  # Windmill, TGU, Around-the-World
    "COND": ["quadriceps", "panturrilha", "core"],  # Burpee, Jumping
    "FLOW": ["core", "deltoide", "quadriceps"],  # Combos
}


def musculos_para_padrao(padrao_kb: str):
    """Retorna lista de músculos a destacar para um padrão KB."""
    return PADRAO_MUSCULOS.get(padrao_kb, ["core", "quadriceps"])
